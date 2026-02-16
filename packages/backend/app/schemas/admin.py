from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    is_verified_player: Optional[bool] = None
    kyc_status: Optional[str] = None


class FeeConfigRequest(BaseModel):
    rate: Decimal = Field(ge=0, le=1)
    min_fee: Decimal = Field(ge=0)
    max_fee: Decimal = Field(gt=0)
    currency: str


class FeeConfigResponse(BaseModel):
    id: str
    rate: Decimal
    min_fee: Decimal
    max_fee: Decimal
    currency: str
    is_active: bool
    effective_from: str
    created_by: str


class AmlReviewRequest(BaseModel):
    action: str  # approve | reject
    notes: str = ""
