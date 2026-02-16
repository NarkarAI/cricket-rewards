from datetime import datetime

from app.models.kyc_document import KycDocument
from app.models.user import User


async def upload_document(user_id: str, document_type: str, file_key: str) -> KycDocument:
    doc = KycDocument(
        user_id=user_id,
        document_type=document_type,
        file_key=file_key,
    )
    await doc.insert()

    # Update user KYC status to pending if not already
    user = await User.find_one(User.firebase_uid == user_id)
    if user and user.kyc_status == "not_started":
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


async def get_user_documents(user_id: str) -> list[KycDocument]:
    return await KycDocument.find(KycDocument.user_id == user_id).to_list()


async def get_pending_reviews() -> list[KycDocument]:
    return await KycDocument.find(KycDocument.status == "submitted").to_list()
