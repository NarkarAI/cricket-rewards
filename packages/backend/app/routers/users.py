import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse

from app.auth.dependencies import get_current_user
from app.config import settings
from app.dependencies import get_client_ip
from app.models.user import GeoInfo, User
from app.schemas.user import GeoResponse, UserResponse, UserUpdateRequest
from app.services.geo_service import detect_geo

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        firebase_uid=user.firebase_uid,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        role=user.role,
        sport=user.sport,
        teams=user.teams,
        bio=user.bio,
        is_verified_player=user.is_verified_player,
        geo=GeoResponse(
            country_code=user.geo.country_code,
            currency=user.geo.currency,
            detected_ip=user.geo.detected_ip,
        ),
        kyc_status=user.kyc_status,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)


@router.patch("/me", response_model=UserResponse)
async def update_me(req: UserUpdateRequest, user: User = Depends(get_current_user)):
    update_data = req.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    user.updated_at = datetime.utcnow()
    await user.save()
    return _user_response(user)


@router.get("/me/geo", response_model=GeoResponse)
async def get_my_geo(request: Request, user: User = Depends(get_current_user)):
    ip = get_client_ip(request)
    geo = await detect_geo(ip)
    user.geo = GeoInfo(**geo)
    user.updated_at = datetime.utcnow()
    await user.save()
    return GeoResponse(**geo)


@router.post("/me/become-player")
async def become_player(req: UserUpdateRequest, user: User = Depends(get_current_user)):
    """Spectator requests to become a player. Fills in sport/team/bio and changes role."""
    if user.role == "player":
        raise HTTPException(status_code=400, detail="Already a player")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot become a player")

    if req.display_name:
        user.display_name = req.display_name
    if req.sport:
        user.sport = req.sport
    if req.teams is not None:
        user.teams = req.teams
    if req.bio:
        user.bio = req.bio

    user.role = "player"
    user.updated_at = datetime.utcnow()
    await user.save()
    return _user_response(user)


AVATAR_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Upload a profile picture."""
    if file.content_type not in AVATAR_ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    contents = await file.read()
    if len(contents) > settings.avatar_max_file_size:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    ext = os.path.splitext(file.filename or "avatar")[1] or ".jpg"
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}{ext}"

    avatar_dir = Path(settings.avatar_upload_dir)
    avatar_dir.mkdir(parents=True, exist_ok=True)

    # Remove old avatar file if exists
    if user.avatar_url:
        old_file = avatar_dir / user.avatar_url.split("/")[-1]
        if old_file.exists():
            old_file.unlink()

    file_path = avatar_dir / filename
    file_path.write_bytes(contents)

    user.avatar_url = f"/api/v1/users/avatars/{filename}"
    user.updated_at = datetime.utcnow()
    await user.save()

    return {"avatar_url": user.avatar_url}


@router.get("/avatars/{filename}")
async def get_avatar(filename: str):
    """Serve avatar image (public, no auth required)."""
    file_path = Path(settings.avatar_upload_dir) / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(path=str(file_path))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user)
