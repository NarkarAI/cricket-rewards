from typing import Optional

from pydantic import BaseModel


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
    team: str
    bio: str
    is_verified_player: bool
    geo: GeoResponse
    kyc_status: str


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    sport: Optional[str] = None
    team: Optional[str] = None


class AdminUserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_verified_player: Optional[bool] = None
    kyc_status: Optional[str] = None
