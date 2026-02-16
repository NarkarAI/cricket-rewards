from datetime import datetime
from decimal import Decimal
from typing import Optional

from beanie import Document
from pydantic import Field


class FeeConfiguration(Document):
    rate: Decimal = Decimal("0.05")
    min_fee: Decimal = Decimal("0.01")
    max_fee: Decimal = Decimal("500.00")
    currency: str = "USD"

    is_active: bool = True
    effective_from: datetime = Field(default_factory=datetime.utcnow)

    created_by: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "fee_configurations"
