import asyncio
import logging
from datetime import datetime
from decimal import Decimal

import redis.asyncio as aioredis

from app.models.reward import Reward, StatusHistoryEntry
from app.models.user import User
from app.services import aml_service, fee_engine, ledger_service, wallet_service
from app.services.fraud_service import run_fraud_checks
from app.services.notification_service import notify_reward_failure, notify_reward_success
from app.services.stripe_service import create_payment_intent
from app.services.razorpay_service import create_order as create_razorpay_order
from app.utils.currency import validate_reward_amount
from app.utils.exceptions import DuplicateRewardError, FraudCheckFailedError

logger = logging.getLogger(__name__)


async def initiate_reward(
    sender: User,
    receiver_id: str,
    amount: Decimal,
    currency: str,
    message: str,
    is_public: bool,
    idempotency_key: str,
    payment_gateway: str,
    redis_client: aioredis.Redis,
) -> dict:
    """Create a reward and initiate payment."""

    # Check idempotency
    existing = await Reward.find_one(Reward.idempotency_key == idempotency_key)
    if existing:
        raise DuplicateRewardError()

    # Validate receiver exists and is a player
    receiver = await User.get(receiver_id)
    if not receiver or receiver.role != "player":
        raise ValueError("Invalid receiver: must be a verified player")

    # Prevent self-rewards
    if str(sender.id) == receiver_id:
        raise ValueError("You cannot send a reward to yourself")

    # Validate amount
    valid, error_msg = validate_reward_amount(amount, currency)
    if not valid:
        raise ValueError(error_msg)

    # Run fraud checks
    fraud_result = await run_fraud_checks(sender, amount, currency, redis_client)
    if fraud_result.blocked:
        raise FraudCheckFailedError(fraud_result.flags)

    # Calculate fees
    fee_calc = await fee_engine.calculate_fee(amount, currency)

    # Create reward document
    reward = Reward(
        idempotency_key=idempotency_key,
        sender_id=str(sender.id),
        receiver_id=receiver_id,
        gross_amount=amount,
        fee_amount=fee_calc.fee,
        net_amount=fee_calc.net,
        fee_rate=fee_calc.rate,
        currency=currency,
        message=message,
        is_public=is_public,
        payment_gateway=payment_gateway,
        status="initiated",
        fraud_score=fraud_result.score,
        fraud_flags=fraud_result.flags,
        status_history=[StatusHistoryEntry(status="initiated")],
    )
    await reward.insert()

    # Create payment with gateway
    payment_data = {}
    if payment_gateway == "stripe":
        amount_cents = int(amount * 100)
        result = await create_payment_intent(
            amount_cents=amount_cents,
            currency=currency,
            idempotency_key=f"reward_{reward.reward_id}",
            metadata={"reward_id": reward.reward_id},
        )
        reward.payment_intent_id = result["payment_intent_id"]
        payment_data["stripe_client_secret"] = result["client_secret"]
    elif payment_gateway == "razorpay":
        amount_paise = int(amount * 100)
        result = await create_razorpay_order(
            amount_paise=amount_paise,
            currency=currency,
            receipt=reward.reward_id,
        )
        reward.payment_intent_id = result["order_id"]
        payment_data["razorpay_order_id"] = result["order_id"]
        payment_data["razorpay_key_id"] = __import__("app.config", fromlist=["settings"]).settings.razorpay_key_id

    # Update status to payment_pending
    reward.status = "payment_pending"
    reward.status_history.append(StatusHistoryEntry(status="payment_pending"))
    reward.updated_at = datetime.utcnow()
    await reward.save()

    return {
        "reward": reward,
        **payment_data,
    }


async def complete_reward(reward_id: str, emitter=None) -> Reward:
    """Complete a reward after payment confirmation (webhook-driven)."""
    reward = await Reward.find_one(Reward.reward_id == reward_id)
    if not reward:
        raise ValueError("Reward not found")

    # Idempotent: if already completed, return
    if reward.status == "completed":
        return reward

    if reward.status not in ("payment_pending", "payment_confirmed"):
        raise ValueError(f"Cannot complete reward in status: {reward.status}")

    # Mark payment confirmed
    reward.status = "payment_confirmed"
    reward.status_history.append(StatusHistoryEntry(status="payment_confirmed"))
    await reward.save()

    # AML screening
    aml_result = await aml_service.screen_transaction(
        reward.receiver_id, reward.net_amount, reward.currency
    )

    # Credit player wallet
    if aml_result.flagged:
        await wallet_service.credit_pending(
            reward.receiver_id, reward.net_amount, reward.currency
        )
    else:
        await wallet_service.credit_available(
            reward.receiver_id, reward.net_amount, reward.currency
        )

    # Write ledger entries (double-entry)
    sent_entry = await ledger_service.record_reward_sent(
        user_id=reward.sender_id,
        reward_id=reward.reward_id,
        amount=reward.gross_amount,
        currency=reward.currency,
    )
    received_entry = await ledger_service.record_reward_received(
        user_id=reward.receiver_id,
        reward_id=reward.reward_id,
        amount=reward.net_amount,
        currency=reward.currency,
        related_entry_ids=[sent_entry.entry_id],
    )
    fee_entry = await ledger_service.record_platform_fee(
        reward_id=reward.reward_id,
        amount=reward.fee_amount,
        currency=reward.currency,
        related_entry_ids=[sent_entry.entry_id, received_entry.entry_id],
    )

    # Update sent entry with related IDs
    await LedgerEntry_update_related(
        sent_entry.entry_id, [received_entry.entry_id, fee_entry.entry_id]
    )

    # Mark completed
    reward.status = "completed"
    reward.status_history.append(StatusHistoryEntry(status="completed"))
    reward.updated_at = datetime.utcnow()
    await reward.save()

    # Emit real-time events
    if emitter:
        wallet = await wallet_service.get_or_create_wallet(reward.receiver_id)
        await emitter.emit_wallet_update(reward.receiver_id, wallet)
        await emitter.emit_reward_new(reward.receiver_id, reward)
        await emitter.emit_reward_status(reward.sender_id, reward)

    # Send email + SMS notifications (fire-and-forget)
    asyncio.create_task(_safe_notify_success(reward))

    return reward


async def _safe_notify_success(reward):
    try:
        await notify_reward_success(reward)
    except Exception:
        logger.exception("Notification error for reward %s", reward.reward_id)


async def _safe_notify_failure(reward):
    try:
        await notify_reward_failure(reward)
    except Exception:
        logger.exception("Notification error for reward %s", reward.reward_id)


async def fail_reward(reward_id: str, reason: str = "") -> Reward:
    reward = await Reward.find_one(Reward.reward_id == reward_id)
    if not reward:
        raise ValueError("Reward not found")

    reward.status = "failed"
    reward.status_history.append(StatusHistoryEntry(status="failed", reason=reason))
    reward.updated_at = datetime.utcnow()
    await reward.save()

    # Send failure notification to spectator only (fire-and-forget)
    asyncio.create_task(_safe_notify_failure(reward))

    return reward


async def LedgerEntry_update_related(entry_id: str, related_ids: list[str]):
    """Update related entry IDs on a ledger entry (append-only safe: only adds links)."""
    from app.models.ledger_entry import LedgerEntry

    await LedgerEntry.get_pymongo_collection().update_one(
        {"entry_id": entry_id},
        {"$set": {"related_entry_ids": related_ids}},
    )
