import json
import logging

from fastapi import APIRouter, HTTPException, Request

from app.realtime.emitter import emitter
from app.services.reward_service import complete_reward, fail_reward
from app.services.stripe_service import verify_webhook_signature as verify_stripe_sig
from app.services.razorpay_service import verify_webhook_signature as verify_razorpay_sig
from app.services.webhook_service import is_event_processed, mark_processed, record_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig = request.headers.get("Stripe-Signature", "")

    try:
        event = verify_stripe_sig(payload, sig)
    except Exception as e:
        logger.error(f"Stripe webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event["id"]
    event_type = event["type"]

    # Idempotency check
    if await is_event_processed(event_id):
        return {"status": "already_processed"}

    await record_event(event_id, "stripe", event_type, event)

    try:
        if event_type == "payment_intent.succeeded":
            pi = event["data"]["object"]
            reward_id = pi.get("metadata", {}).get("reward_id")
            if reward_id:
                await complete_reward(reward_id, emitter=emitter)

        elif event_type == "payment_intent.payment_failed":
            pi = event["data"]["object"]
            reward_id = pi.get("metadata", {}).get("reward_id")
            if reward_id:
                await fail_reward(reward_id, reason="Payment failed")

        await mark_processed(event_id)
    except Exception as e:
        logger.exception(f"Stripe webhook processing error for {event_id}: {e}")
        await mark_processed(event_id, error=str(e))
        # Return 200 to prevent Stripe retries for unrecoverable errors.
        # Failed events are tracked in webhook_events for manual review.

    return {"status": "ok"}


@router.post("/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events."""
    payload = await request.body()
    sig = request.headers.get("X-Razorpay-Signature", "")

    if not verify_razorpay_sig(payload, sig):
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = json.loads(payload)
    event_id = data.get("event_id", data.get("id", ""))
    event_type = data.get("event", "")

    # Idempotency check
    if await is_event_processed(event_id):
        return {"status": "already_processed"}

    await record_event(event_id, "razorpay", event_type, data)

    try:
        if event_type == "payment.captured":
            payment = data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id", "")
            if order_id:
                # Find reward by payment_intent_id (which stores razorpay order_id)
                from app.models.reward import Reward

                reward = await Reward.find_one(Reward.payment_intent_id == order_id)
                if reward:
                    await complete_reward(reward.reward_id, emitter=emitter)

        elif event_type == "payment.failed":
            payment = data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id", "")
            if order_id:
                from app.models.reward import Reward

                reward = await Reward.find_one(Reward.payment_intent_id == order_id)
                if reward:
                    await fail_reward(reward.reward_id, reason="Payment failed")

        await mark_processed(event_id)
    except Exception as e:
        logger.exception(f"Razorpay webhook processing error for {event_id}: {e}")
        await mark_processed(event_id, error=str(e))
        # Return 200 to prevent Razorpay retries for unrecoverable errors.

    return {"status": "ok"}
