from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user, require_admin
from app.auth.firebase import set_custom_claims, verify_firebase_token
from app.models.user import GeoInfo, User
from app.schemas.auth import AuthResponse, RegisterRequest, SyncClaimsRequest
from app.services.wallet_service import get_or_create_wallet

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Create a user record after Firebase signup."""
    try:
        decoded = await verify_firebase_token(req.firebase_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    uid = decoded["uid"]
    email = decoded.get("email", "")

    # Check if already registered
    existing = await User.find_one(User.firebase_uid == uid)
    if existing:
        return AuthResponse(
            id=str(existing.id),
            firebase_uid=existing.firebase_uid,
            email=existing.email,
            display_name=existing.display_name,
            role=existing.role,
        )

    user = User(
        firebase_uid=uid,
        email=email,
        display_name=req.display_name or decoded.get("name", ""),
        role="spectator",
        geo=GeoInfo(),
    )
    await user.insert()

    # Create wallet
    await get_or_create_wallet(str(user.id))

    return AuthResponse(
        id=str(user.id),
        firebase_uid=user.firebase_uid,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
    )


@router.post("/sync-claims")
async def sync_claims(req: SyncClaimsRequest, admin: User = Depends(require_admin)):
    """Admin sets role via Firebase custom claims."""
    if req.role not in ("spectator", "player", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    await set_custom_claims(req.uid, {"role": req.role})

    user = await User.find_one(User.firebase_uid == req.uid)
    if user:
        user.role = req.role
        user.updated_at = datetime.utcnow()
        await user.save()

    return {"status": "ok", "uid": req.uid, "role": req.role}


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "firebase_uid": user.firebase_uid,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "sport": user.sport,
        "teams": user.teams,
        "bio": user.bio,
        "is_verified_player": user.is_verified_player,
        "geo": {
            "country_code": user.geo.country_code,
            "currency": user.geo.currency,
            "detected_ip": user.geo.detected_ip,
        },
        "kyc_status": user.kyc_status,
    }
