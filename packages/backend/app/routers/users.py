from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth.dependencies import get_current_user
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
        team=user.team,
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
    if req.team:
        user.team = req.team
    if req.bio:
        user.bio = req.bio

    user.role = "player"
    user.updated_at = datetime.utcnow()
    await user.save()
    return _user_response(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user)
