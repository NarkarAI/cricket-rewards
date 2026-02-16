from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


class KycDocument(Document):
    user_id: Indexed(str)
    document_type: str  # id_proof | address_proof | pan_card | selfie
    file_key: str  # object storage reference

    status: str = Field(default="submitted")  # submitted | under_review | approved | rejected

    reviewer_id: Optional[str] = None
    review_notes: str = ""
    reviewed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "kyc_documents"
