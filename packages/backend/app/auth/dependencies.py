from fastapi import Depends, HTTPException, Request, status

from app.auth.firebase import verify_firebase_token
from app.models.user import User


async def get_current_user(request: Request) -> User:
    """Extract and verify Firebase token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = auth_header[7:]
    try:
        decoded = await verify_firebase_token(token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    user = await User.find_one(User.firebase_uid == decoded["uid"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not registered")
    return user


async def require_spectator(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("spectator", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Spectator role required")
    return user


async def require_player(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("player", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Player role required")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return user
