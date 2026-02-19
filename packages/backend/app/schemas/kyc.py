from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KycUploadResponse(BaseModel):
    id: str
    document_type: str
    file_name: str = ""
    content_type: str = ""
    status: str
    created_at: datetime


class KycStatusResponse(BaseModel):
    kyc_status: str
    documents: list[KycUploadResponse]


class KycReviewRequest(BaseModel):
    status: str  # approved | rejected
    review_notes: str = ""


# --- Country-specific KYC profile ---

class KycProfileSubmit(BaseModel):
    country: str  # "IN" or "US"
    full_name: str
    date_of_birth: str  # YYYY-MM-DD
    address_line1: str
    address_line2: str = ""
    city: str
    state: str
    postal_code: str
    # India
    pan_number: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    # USA
    ssn_last4: Optional[str] = None
    gov_id_type: Optional[str] = None  # drivers_license | passport


class KycProfileResponse(BaseModel):
    country: str
    full_name: str
    date_of_birth: str
    address_line1: str
    address_line2: str = ""
    city: str
    state: str
    postal_code: str
    pan_number: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    ssn_last4: Optional[str] = None
    gov_id_type: Optional[str] = None


class BankAccountSubmit(BaseModel):
    country: str  # "IN" or "US"
    account_holder_name: str
    account_number: str  # full number (not stored)
    # India
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    # USA
    routing_number: Optional[str] = None
    account_type: Optional[str] = None  # checking | savings


class BankAccountResponse(BaseModel):
    id: str
    country: str
    account_holder_name: str
    account_number_last4: str
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    routing_number: Optional[str] = None
    account_type: Optional[str] = None
    status: str
    verification_method: str = ""
    created_at: datetime


class BankReviewRequest(BaseModel):
    status: str  # verified | rejected
    review_notes: str = ""


class KycFullStatusResponse(BaseModel):
    kyc_status: str
    kyc_profile: Optional[KycProfileResponse] = None
    documents: list[KycUploadResponse]
    bank_account: Optional[BankAccountResponse] = None
    pan_verified: bool = False
    bank_verified: bool = False
    kyc_completed: bool = False
