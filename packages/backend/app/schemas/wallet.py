from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from pydantic import BaseModel, Field, model_serializer

TWO_PLACES = Decimal("0.01")


def _round2(v: Decimal) -> str:
    return str(v.quantize(TWO_PLACES, rounding=ROUND_HALF_UP))


class WalletResponse(BaseModel):
    user_id: str
    currency: str
    available_balance: Decimal
    pending_balance: Decimal
    held_balance: Decimal
    lifetime_received: Decimal
    lifetime_sent: Decimal

    @model_serializer(mode="wrap")
    def _round_decimals(self, handler):
        data = handler(self)
        for key in ("available_balance", "pending_balance", "held_balance", "lifetime_received", "lifetime_sent"):
            if key in data and data[key] is not None:
                data[key] = _round2(Decimal(str(data[key])))
        return data


class LedgerEntryResponse(BaseModel):
    entry_id: str
    entry_type: str
    direction: str
    amount: Decimal
    currency: str
    balance_after: Decimal
    description: str
    created_at: datetime

    @model_serializer(mode="wrap")
    def _round_decimals(self, handler):
        data = handler(self)
        for key in ("amount", "balance_after"):
            if key in data and data[key] is not None:
                data[key] = _round2(Decimal(str(data[key])))
        return data


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str
