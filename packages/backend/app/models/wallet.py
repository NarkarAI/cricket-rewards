from datetime import datetime
from decimal import Decimal

from beanie import Document, Indexed
from pydantic import Field


class Wallet(Document):
    user_id: Indexed(str, unique=True)
    currency: str = "USD"

    available_balance: Decimal = Decimal("0.00")
    pending_balance: Decimal = Decimal("0.00")
    held_balance: Decimal = Decimal("0.00")

    lifetime_received: Decimal = Decimal("0.00")
    lifetime_sent: Decimal = Decimal("0.00")
    lifetime_fees_paid: Decimal = Decimal("0.00")

    version: int = Field(default=0)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "wallets"
