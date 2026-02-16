import socketio

from app.auth.firebase import verify_firebase_token
from app.models.user import User

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ, auth):
    """Authenticate Socket.io connections via Firebase token."""
    if not auth or "token" not in auth:
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")

    try:
        decoded = await verify_firebase_token(auth["token"])
        uid = decoded["uid"]
    except (ValueError, KeyError):
        raise socketio.exceptions.ConnectionRefusedError("Invalid token")

    user = await User.find_one(User.firebase_uid == uid)
    if not user:
        raise socketio.exceptions.ConnectionRefusedError("User not found")

    # Save user info in session
    await sio.save_session(sid, {"uid": uid, "user_id": str(user.id), "role": user.role})

    # Join user-specific room
    sio.enter_room(sid, f"user:{uid}")

    # Join player room if applicable
    if user.role == "player":
        sio.enter_room(sid, f"player:{uid}")


@sio.event
async def disconnect(sid):
    pass
