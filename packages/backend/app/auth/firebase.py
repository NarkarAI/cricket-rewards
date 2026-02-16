import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from app.config import settings

_initialized = False


def init_firebase():
    global _initialized
    if _initialized:
        return
    if settings.firebase_service_account_path:
        cred = credentials.Certificate(settings.firebase_service_account_path)
        firebase_admin.initialize_app(cred)
    else:
        # Use application default credentials or mock in development
        try:
            firebase_admin.initialize_app()
        except ValueError:
            pass
    _initialized = True


async def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    init_firebase()
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {e}")


async def set_custom_claims(uid: str, claims: dict):
    """Set custom claims on a Firebase user (e.g., role)."""
    init_firebase()
    firebase_auth.set_custom_user_claims(uid, claims)
