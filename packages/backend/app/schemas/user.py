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
    nationality: str
    profile_background: str
    is_verified_player: bool
    geo: GeoResponse
    kyc_status: str


ALLOWED_BACKGROUNDS = {
    "", "flag", "gradient-blue", "gradient-gold", "gradient-green",
    "gradient-purple", "dark", "sunset", "ocean",
}


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    sport: Optional[str] = None
    teams: Optional[list[str]] = None
    nationality: Optional[str] = None
    profile_background: Optional[str] = None

    @field_validator("teams")
    @classmethod
    def validate_teams(cls, v):
        if v is not None:
            v = [t.strip() for t in v if t.strip()]
            if len(v) > 10:
                raise ValueError("Maximum 10 teams allowed")
        return v

    @field_validator("nationality")
    @classmethod
    def validate_nationality(cls, v):
        if v is not None:
            v = v.strip().upper()
            if v and (len(v) != 2 or not v.isalpha()):
                raise ValueError("Nationality must be a 2-letter country code")
        return v

    @field_validator("profile_background")
    @classmethod
    def validate_profile_background(cls, v):
        if v is not None and v not in ALLOWED_BACKGROUNDS:
            raise ValueError(f"Invalid background theme: {v}")
        return v


class AdminUserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_verified_player: Optional[bool] = None
    kyc_status: Optional[str] = None
