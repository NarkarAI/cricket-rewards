from decimal import Decimal

from pydantic import BaseModel


class CreateStripeIntentRequest(BaseModel):
    reward_id: str
    amount: Decimal
    currency: str


class CreateStripeIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str


class CreateRazorpayOrderRequest(BaseModel):
    reward_id: str
    amount: Decimal
    currency: str


class CreateRazorpayOrderResponse(BaseModel):
    order_id: str
    key_id: str
    amount: int  # in paise
    currency: str


class VerifyRazorpayRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    reward_id: str
