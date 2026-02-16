from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field


class GeoInfo(BaseModel):
    country_code: str = ""
    currency: str = "USD"
    detected_ip: str = ""


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

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
