from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from app.utils.decimal_type import DecimalField


class StatusHistoryEntry(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reason: str = ""


class Reward(Document):
    reward_id: Indexed(str, unique=True) = Field(default_factory=lambda: str(uuid4()))
    idempotency_key: Indexed(str, unique=True)

    sender_id: Indexed(str)
    receiver_id: Indexed(str)

    gross_amount: DecimalField
    fee_amount: DecimalField = Decimal("0.00")
    net_amount: DecimalField = Decimal("0.00")
    fee_rate: DecimalField = Decimal("0.05")
    currency: str

    message: str = ""
    is_public: bool = True

    payment_gateway: str  # stripe | razorpay
    payment_intent_id: str = ""  # Stripe PaymentIntent ID or Razorpay Order ID

    status: str = Field(default="initiated")
    # initiated -> payment_pending -> payment_confirmed -> completed | failed | refunded

    fraud_score: float = 0.0
    fraud_flags: list[str] = Field(default_factory=list)

    status_history: list[StatusHistoryEntry] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "rewards"
