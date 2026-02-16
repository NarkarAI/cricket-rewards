from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.reward import Reward
from app.models.user import User
from app.schemas.payment import (
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    CreateStripeIntentRequest,
    CreateStripeIntentResponse,
    VerifyRazorpayRequest,
)
from app.services.razorpay_service import verify_payment_signature
from app.services.stripe_service import create_payment_intent

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.post("/create-stripe-intent", response_model=CreateStripeIntentResponse)
async def create_stripe_intent(
    req: CreateStripeIntentRequest,
    user: User = Depends(get_current_user),
):
    reward = await Reward.find_one(Reward.reward_id == req.reward_id)
    if not reward or reward.sender_id != str(user.id):
        raise HTTPException(status_code=404, detail="Reward not found")

    amount_cents = int(req.amount * 100)
    result = await create_payment_intent(
        amount_cents=amount_cents,
        currency=req.currency,
        idempotency_key=f"pi_{reward.reward_id}",
        metadata={"reward_id": reward.reward_id},
    )
    return CreateStripeIntentResponse(
        client_secret=result["client_secret"],
        payment_intent_id=result["payment_intent_id"],
    )


@router.post("/create-razorpay-order", response_model=CreateRazorpayOrderResponse)
async def create_razorpay_order(
    req: CreateRazorpayOrderRequest,
    user: User = Depends(get_current_user),
):
    reward = await Reward.find_one(Reward.reward_id == req.reward_id)
    if not reward or reward.sender_id != str(user.id):
        raise HTTPException(status_code=404, detail="Reward not found")

    from app.services.razorpay_service import create_order

    amount_paise = int(req.amount * 100)
    result = await create_order(
        amount_paise=amount_paise,
        currency=req.currency,
        receipt=reward.reward_id,
    )
    return CreateRazorpayOrderResponse(
        order_id=result["order_id"],
        key_id=settings.razorpay_key_id,
        amount=result["amount"],
        currency=result["currency"],
    )


@router.post("/verify-razorpay")
async def verify_razorpay(
    req: VerifyRazorpayRequest,
    user: User = Depends(get_current_user),
):
    """Verify Razorpay payment signature after client-side payment."""
    valid = verify_payment_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature,
    )
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    return {"status": "verified", "reward_id": req.reward_id}
