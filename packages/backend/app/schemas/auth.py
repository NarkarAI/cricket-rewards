from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    firebase_token: str
    display_name: str = ""


class SyncClaimsRequest(BaseModel):
    uid: str
    role: str


class AuthResponse(BaseModel):
    id: str
    firebase_uid: str
    email: str
    display_name: str
    role: str
