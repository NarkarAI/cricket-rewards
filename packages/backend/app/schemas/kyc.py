from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KycUploadResponse(BaseModel):
    id: str
    document_type: str
    status: str
    created_at: datetime


class KycStatusResponse(BaseModel):
    kyc_status: str
    documents: list[KycUploadResponse]


class KycReviewRequest(BaseModel):
    status: str  # approved | rejected
    review_notes: str = ""
