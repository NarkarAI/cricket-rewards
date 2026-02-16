import asyncio
from datetime import datetime
from decimal import Decimal

from app.models.wallet import Wallet
from app.utils.exceptions import InsufficientBalanceError, OptimisticLockError

MAX_RETRIES = 3


async def get_or_create_wallet(user_id: str, currency: str = "USD") -> Wallet:
    wallet = await Wallet.find_one(Wallet.user_id == user_id)
    if not wallet:
        wallet = Wallet(user_id=user_id, currency=currency)
        await wallet.insert()
    return wallet


async def credit_available(user_id: str, amount: Decimal, currency: str = "USD") -> Wallet:
    """Credit funds to available balance with optimistic locking."""
    for attempt in range(MAX_RETRIES):
        wallet = await get_or_create_wallet(user_id, currency)
        current_version = wallet.version

        result = await Wallet.get_motor_collection().update_one(
            {"user_id": user_id, "version": current_version},
            {
                "$inc": {
                    "available_balance": float(amount),
                    "lifetime_received": float(amount),
                    "version": 1,
                },
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        if result.modified_count == 1:
            return await Wallet.find_one(Wallet.user_id == user_id)

        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(0.1 * (2**attempt))

    raise OptimisticLockError()


async def credit_pending(user_id: str, amount: Decimal, currency: str = "USD") -> Wallet:
    """Credit funds to pending balance (for AML-flagged transactions)."""
    for attempt in range(MAX_RETRIES):
        wallet = await get_or_create_wallet(user_id, currency)
        current_version = wallet.version

        result = await Wallet.get_motor_collection().update_one(
            {"user_id": user_id, "version": current_version},
            {
                "$inc": {
                    "pending_balance": float(amount),
                    "version": 1,
                },
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        if result.modified_count == 1:
            return await Wallet.find_one(Wallet.user_id == user_id)

        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(0.1 * (2**attempt))

    raise OptimisticLockError()


async def release_pending_to_available(user_id: str, amount: Decimal) -> Wallet:
    """Move funds from pending to available (after AML approval)."""
    for attempt in range(MAX_RETRIES):
        wallet = await Wallet.find_one(Wallet.user_id == user_id)
        if not wallet or wallet.pending_balance < amount:
            raise InsufficientBalanceError()

        current_version = wallet.version

        result = await Wallet.get_motor_collection().update_one(
            {"user_id": user_id, "version": current_version},
            {
                "$inc": {
                    "pending_balance": -float(amount),
                    "available_balance": float(amount),
                    "version": 1,
                },
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        if result.modified_count == 1:
            return await Wallet.find_one(Wallet.user_id == user_id)

        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(0.1 * (2**attempt))

    raise OptimisticLockError()


async def debit_available(user_id: str, amount: Decimal) -> Wallet:
    """Debit funds from available balance (for withdrawals)."""
    for attempt in range(MAX_RETRIES):
        wallet = await Wallet.find_one(Wallet.user_id == user_id)
        if not wallet or wallet.available_balance < amount:
            raise InsufficientBalanceError()

        current_version = wallet.version

        result = await Wallet.get_motor_collection().update_one(
            {"user_id": user_id, "version": current_version},
            {
                "$inc": {
                    "available_balance": -float(amount),
                    "lifetime_sent": float(amount),
                    "version": 1,
                },
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        if result.modified_count == 1:
            return await Wallet.find_one(Wallet.user_id == user_id)

        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(0.1 * (2**attempt))

    raise OptimisticLockError()


async def record_fee(user_id: str, fee_amount: Decimal) -> None:
    """Record fees paid (tracking only, fees are deducted from gross before credit)."""
    await Wallet.get_motor_collection().update_one(
        {"user_id": user_id},
        {"$inc": {"lifetime_fees_paid": float(fee_amount)}},
    )
