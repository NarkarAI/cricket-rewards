import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.models.kyc_document import KycDocument
from app.models.user import User

VALID_DOC_TYPES = {"id_proof", "address_proof", "pan_card", "selfie"}


def _get_upload_dir(user_id: str) -> Path:
    path = Path(settings.kyc_upload_dir) / user_id
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_file(user_id: str, document_type: str, file: UploadFile) -> tuple[str, str, str]:
    """Save uploaded file to disk. Returns (file_key, safe_filename, content_type)."""
    content_type = file.content_type or "application/octet-stream"
    allowed = [t.strip() for t in settings.kyc_allowed_types.split(",")]
    if content_type not in allowed:
        raise ValueError(f"File type '{content_type}' not allowed. Accepted: {', '.join(allowed)}")

    contents = await file.read()
    if len(contents) > settings.kyc_max_file_size:
        raise ValueError(f"File too large. Maximum size: {settings.kyc_max_file_size // (1024*1024)}MB")

    ext = os.path.splitext(file.filename or "file")[1] or ".bin"
    safe_name = f"{document_type}_{uuid.uuid4().hex[:8]}{ext}"
    upload_dir = _get_upload_dir(user_id)
    file_path = upload_dir / safe_name
    file_path.write_bytes(contents)

    file_key = f"{user_id}/{safe_name}"
    return file_key, file.filename or safe_name, content_type


async def upload_document(
    user_id: str, document_type: str, file: UploadFile
) -> KycDocument:
    if document_type not in VALID_DOC_TYPES:
        raise ValueError(f"Invalid document type. Must be one of: {', '.join(VALID_DOC_TYPES)}")

    # Remove any existing document of the same type (replace)
    existing = await KycDocument.find(
        KycDocument.user_id == user_id,
        KycDocument.document_type == document_type,
    ).to_list()
    for old_doc in existing:
        old_path = Path(settings.kyc_upload_dir) / old_doc.file_key
        if old_path.exists():
            old_path.unlink()
        await old_doc.delete()

    file_key, original_name, content_type = await save_file(user_id, document_type, file)

    doc = KycDocument(
        user_id=user_id,
        document_type=document_type,
        file_key=file_key,
        file_name=original_name,
        content_type=content_type,
    )
    await doc.insert()

    # Update user KYC status to pending if not already
    user = await User.find_one(User.firebase_uid == user_id)
    if user and user.kyc_status in ("not_started", "rejected"):
        user.kyc_status = "pending"
        user.updated_at = datetime.utcnow()
        await user.save()

    return doc


async def submit_kyc(user_id: str) -> str:
    """Mark KYC as submitted for review."""
    user = await User.find_one(User.firebase_uid == user_id)
    if not user:
        raise ValueError("User not found")

    docs = await KycDocument.find(KycDocument.user_id == user_id).to_list()
    if not docs:
        raise ValueError("No documents uploaded")

    doc_types = {d.document_type for d in docs}
    required = {"id_proof"}
    missing = required - doc_types
    if missing:
        raise ValueError(f"Missing required documents: {', '.join(missing)}")

    user.kyc_status = "pending"
    user.updated_at = datetime.utcnow()
    await user.save()
    return "pending"


async def review_document(
    doc_id: str, reviewer_id: str, status: str, notes: str = ""
) -> KycDocument:
    doc = await KycDocument.get(doc_id)
    if not doc:
        raise ValueError("Document not found")

    if status not in ("approved", "rejected"):
        raise ValueError("Status must be 'approved' or 'rejected'")

    doc.status = status
    doc.reviewer_id = reviewer_id
    doc.review_notes = notes
    doc.reviewed_at = datetime.utcnow()
    doc.updated_at = datetime.utcnow()
    await doc.save()

    # If all docs for user are approved, approve user KYC
    user_docs = await KycDocument.find(KycDocument.user_id == doc.user_id).to_list()
    all_approved = all(d.status == "approved" for d in user_docs)
    any_rejected = any(d.status == "rejected" for d in user_docs)

    user = await User.find_one(User.firebase_uid == doc.user_id)
    if user:
        if all_approved:
            user.kyc_status = "approved"
            user.is_verified_player = True
        elif any_rejected:
            user.kyc_status = "rejected"
        user.updated_at = datetime.utcnow()
        await user.save()

    return doc


def get_file_path(file_key: str) -> Path:
    """Get the absolute path for a stored file."""
    return Path(settings.kyc_upload_dir) / file_key


async def get_user_documents(user_id: str) -> list[KycDocument]:
    return await KycDocument.find(KycDocument.user_id == user_id).to_list()


async def get_pending_reviews() -> list[KycDocument]:
    return await KycDocument.find(KycDocument.status == "submitted").to_list()
