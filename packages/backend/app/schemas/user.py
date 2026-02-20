from typing import Optional

from pydantic import BaseModel, field_validator


class GeoResponse(BaseModel):
    country_code: str
    currency: str
    detected_ip: str


class UserResponse(BaseModel):
    id: str
    firebase_uid: str
    email: str
    display_name: str
    avatar_url: str
    role: str
    sport: str
    teams: list[str]
    bio: str
    is_verified_player: bool
    geo: GeoResponse
    kyc_status: str


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    sport: Optional[str] = None
    teams: Optional[list[str]] = None

    @field_validator("teams")
    @classmethod
    def validate_teams(cls, v):
        if v is not None:
            v = [t.strip() for t in v if t.strip()]
            if len(v) > 10:
                raise ValueError("Maximum 10 teams allowed")
        return v


class AdminUserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_verified_player: Optional[bool] = None
    kyc_status: Optional[str] = None
