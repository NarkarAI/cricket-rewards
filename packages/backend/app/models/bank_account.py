from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


class BankAccount(Document):
    user_id: Indexed(str)
    country: str  # "IN" or "US"
    account_holder_name: str
    account_number_last4: str  # store only last 4
    account_number_hash: str  # SHA-256 hash of full number
    # India
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    # USA
    routing_number: Optional[str] = None
    account_type: Optional[str] = None  # checking | savings
    # Verification
    status: str = Field(default="pending")  # pending | verified | rejected
    verification_method: str = ""  # micro_deposit | upi | admin_manual
    verified_at: Optional[datetime] = None
    reviewer_id: Optional[str] = None
    review_notes: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "bank_accounts"
