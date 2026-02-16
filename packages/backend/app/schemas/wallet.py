from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class WalletResponse(BaseModel):
    user_id: str
    currency: str
    available_balance: Decimal
    pending_balance: Decimal
    held_balance: Decimal
    lifetime_received: Decimal
    lifetime_sent: Decimal


class LedgerEntryResponse(BaseModel):
    entry_id: str
    entry_type: str
    direction: str
    amount: Decimal
    currency: str
    balance_after: Decimal
    description: str
    created_at: datetime


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str
