from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field


class GeoInfo(BaseModel):
    country_code: str = ""
    currency: str = "USD"
    detected_ip: str = ""


class KycProfile(BaseModel):
    country: str = ""  # "IN" or "US"
    full_name: str = ""
    date_of_birth: str = ""  # YYYY-MM-DD
    address_line1: str = ""
    address_line2: str = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    # India-specific
    pan_number: str = ""  # ABCDE1234F
    aadhaar_last4: str = ""  # last 4 digits only
    # USA-specific
    ssn_last4: str = ""  # last 4 digits only
    gov_id_type: str = ""  # drivers_license | passport


class User(Document):
    firebase_uid: Indexed(str, unique=True)
    email: EmailStr
    display_name: str = ""
    avatar_url: str = ""

    role: str = Field(default="spectator")  # spectator | player | admin

    # Player-specific fields
    sport: str = ""
    team: str = ""
    bio: str = ""
    is_verified_player: bool = False

    geo: GeoInfo = Field(default_factory=GeoInfo)
    kyc_status: str = Field(default="not_started")  # not_started | pending | approved | rejected
    kyc_profile: Optional[KycProfile] = None

    # Verification flags
    pan_verified: bool = False
    bank_verified: bool = False
    kyc_completed: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
