from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from beanie import Document, Indexed
from pydantic import Field


class LedgerEntry(Document):
    entry_id: Indexed(str, unique=True) = Field(default_factory=lambda: str(uuid4()))
    reward_id: str = ""
    payment_id: str = ""
    user_id: Indexed(str)

    entry_type: str  # reward_received | reward_sent | platform_fee | withdrawal | refund | adjustment
    direction: str  # credit | debit

    amount: Decimal
    currency: str
    balance_after: Decimal

    related_entry_ids: list[str] = Field(default_factory=list)
    description: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ledger_entries"
