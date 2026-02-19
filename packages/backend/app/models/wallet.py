from datetime import datetime
from decimal import Decimal

from beanie import Document, Indexed
from pydantic import Field

from app.utils.decimal_type import DecimalField


class Wallet(Document):
    user_id: Indexed(str, unique=True)
    currency: str = "USD"

    available_balance: DecimalField = Decimal("0.00")
    pending_balance: DecimalField = Decimal("0.00")
    held_balance: DecimalField = Decimal("0.00")

    lifetime_received: DecimalField = Decimal("0.00")
    lifetime_sent: DecimalField = Decimal("0.00")
    lifetime_fees_paid: DecimalField = Decimal("0.00")

    version: int = Field(default=0)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "wallets"
