from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CreateRewardRequest(BaseModel):
    receiver_id: str
    amount: Decimal = Field(gt=0)
    currency: str
    message: str = ""
    is_public: bool = True
    idempotency_key: str
    payment_gateway: str  # stripe | razorpay


class RewardResponse(BaseModel):
    id: str
    reward_id: str
    sender_id: str
    receiver_id: str
    gross_amount: Decimal
    fee_amount: Decimal
    net_amount: Decimal
    currency: str
    message: str
    is_public: bool
    payment_gateway: str
    status: str
    created_at: datetime

    # Payment initiation data (returned on create)
    stripe_client_secret: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_key_id: Optional[str] = None


class RewardSummary(BaseModel):
    id: str
    reward_id: str
    sender_name: str
    receiver_name: str
    gross_amount: Decimal
    net_amount: Decimal
    currency: str
    message: str
    status: str
    created_at: datetime
