import hashlib
import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.models.bank_account import BankAccount
from app.models.kyc_document import KycDocument
from app.models.user import KycProfile, User
from app.schemas.kyc import BankAccountSubmit, KycProfileSubmit
from app.services.kyc_validators import (
    validate_aadhaar_last4,
    validate_date_of_birth,
    validate_ifsc,
    validate_pan,
    validate_postal_code,
    validate_routing_number,
    validate_ssn_last4,
)

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
            # Set PAN verified if India and pan_card doc approved
            if user.kyc_profile and user.kyc_profile.country == "IN":
                pan_docs = [d for d in user_docs if d.document_type == "pan_card"]
                if pan_docs and all(d.status == "approved" for d in pan_docs):
                    user.pan_verified = True
            _update_kyc_completed(user)
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


# --- Country-specific KYC profile ---


async def submit_kyc_profile(user_id: str, data: KycProfileSubmit) -> User:
    """Save structured personal info for KYC."""
    user = await User.find_one(User.firebase_uid == user_id)
    if not user:
        raise ValueError("User not found")

    if data.country not in ("IN", "US"):
        raise ValueError("Country must be 'IN' or 'US'")

    if not validate_date_of_birth(data.date_of_birth):
        raise ValueError("Date of birth must be in YYYY-MM-DD format")

    if not validate_postal_code(data.postal_code, data.country):
        if data.country == "IN":
            raise ValueError("Indian postal code must be 6 digits")
        else:
            raise ValueError("US ZIP code must be 5 digits (or 5+4 format)")

    # Country-specific validation
    if data.country == "IN":
        if data.pan_number and not validate_pan(data.pan_number):
            raise ValueError("Invalid PAN format. Expected: ABCDE1234F")
        if data.aadhaar_last4 and not validate_aadhaar_last4(data.aadhaar_last4):
            raise ValueError("Aadhaar last 4 must be exactly 4 digits")
    elif data.country == "US":
        if data.ssn_last4 and not validate_ssn_last4(data.ssn_last4):
            raise ValueError("SSN last 4 must be exactly 4 digits")
        if data.gov_id_type and data.gov_id_type not in ("drivers_license", "passport"):
            raise ValueError("Government ID type must be 'drivers_license' or 'passport'")

    profile = KycProfile(
        country=data.country,
        full_name=data.full_name,
        date_of_birth=data.date_of_birth,
        address_line1=data.address_line1,
        address_line2=data.address_line2 or "",
        city=data.city,
        state=data.state,
        postal_code=data.postal_code,
        pan_number=(data.pan_number or "").upper() if data.country == "IN" else "",
        aadhaar_last4=data.aadhaar_last4 or "" if data.country == "IN" else "",
        ssn_last4=data.ssn_last4 or "" if data.country == "US" else "",
        gov_id_type=data.gov_id_type or "" if data.country == "US" else "",
    )

    user.kyc_profile = profile
    # Update geo to match selected country
    user.geo.country_code = data.country
    user.geo.currency = "INR" if data.country == "IN" else "USD"
    if user.kyc_status == "not_started":
        user.kyc_status = "pending"
    user.updated_at = datetime.utcnow()
    await user.save()
    return user


async def submit_bank_account(user_id: str, data: BankAccountSubmit) -> BankAccount:
    """Save bank account details for verification."""
    user = await User.find_one(User.firebase_uid == user_id)
    if not user:
        raise ValueError("User not found")

    if data.country not in ("IN", "US"):
        raise ValueError("Country must be 'IN' or 'US'")

    # Country-specific validation
    if data.country == "IN":
        if not data.ifsc_code:
            raise ValueError("IFSC code is required for Indian bank accounts")
        if not validate_ifsc(data.ifsc_code):
            raise ValueError("Invalid IFSC code format. Expected: e.g. SBIN0001234")
    elif data.country == "US":
        if not data.routing_number:
            raise ValueError("Routing number is required for US bank accounts")
        if not validate_routing_number(data.routing_number):
            raise ValueError("Invalid US routing number")
        if data.account_type not in ("checking", "savings"):
            raise ValueError("Account type must be 'checking' or 'savings'")

    # Remove any existing bank account for this user
    existing = await BankAccount.find(BankAccount.user_id == user_id).to_list()
    for old in existing:
        await old.delete()

    # Hash full account number, store only last 4
    account_hash = hashlib.sha256(data.account_number.encode()).hexdigest()

    bank = BankAccount(
        user_id=user_id,
        country=data.country,
        account_holder_name=data.account_holder_name,
        account_number_last4=data.account_number[-4:],
        account_number_hash=account_hash,
        ifsc_code=data.ifsc_code.upper() if data.ifsc_code else None,
        upi_id=data.upi_id if data.country == "IN" else None,
        routing_number=data.routing_number if data.country == "US" else None,
        account_type=data.account_type if data.country == "US" else None,
    )
    await bank.insert()
    return bank


async def get_user_bank_account(user_id: str) -> BankAccount | None:
    return await BankAccount.find_one(BankAccount.user_id == user_id)


async def verify_bank_account(
    bank_id: str, reviewer_id: str, status: str, notes: str = ""
) -> BankAccount:
    """Admin verifies or rejects a bank account."""
    bank = await BankAccount.get(bank_id)
    if not bank:
        raise ValueError("Bank account not found")

    if status not in ("verified", "rejected"):
        raise ValueError("Status must be 'verified' or 'rejected'")

    bank.status = status
    bank.reviewer_id = reviewer_id
    bank.review_notes = notes
    bank.verification_method = "admin_manual"
    bank.verified_at = datetime.utcnow() if status == "verified" else None
    bank.updated_at = datetime.utcnow()
    await bank.save()

    # Update user's bank_verified flag
    user = await User.find_one(User.firebase_uid == bank.user_id)
    if user:
        user.bank_verified = status == "verified"
        user.updated_at = datetime.utcnow()
        _update_kyc_completed(user)
        await user.save()

    return bank


async def get_pending_bank_reviews() -> list[BankAccount]:
    return await BankAccount.find(BankAccount.status == "pending").to_list()


def _update_kyc_completed(user: User) -> None:
    """Check if all verification steps are complete and update kyc_completed."""
    if user.kyc_status == "approved" and user.bank_verified:
        if user.kyc_profile and user.kyc_profile.country == "IN":
            user.kyc_completed = user.pan_verified and user.bank_verified
        else:
            user.kyc_completed = user.bank_verified
    else:
        user.kyc_completed = False


async def get_full_kyc_status(user_id: str) -> dict:
    """Return combined KYC status: profile, documents, bank, verification flags."""
    user = await User.find_one(User.firebase_uid == user_id)
    if not user:
        raise ValueError("User not found")

    docs = await get_user_documents(user_id)
    bank = await get_user_bank_account(user_id)

    doc_list = [
        {
            "id": str(d.id),
            "document_type": d.document_type,
            "file_name": d.file_name,
            "content_type": d.content_type,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]

    bank_data = None
    if bank:
        bank_data = {
            "id": str(bank.id),
            "country": bank.country,
            "account_holder_name": bank.account_holder_name,
            "account_number_last4": bank.account_number_last4,
            "ifsc_code": bank.ifsc_code,
            "upi_id": bank.upi_id,
            "routing_number": bank.routing_number,
            "account_type": bank.account_type,
            "status": bank.status,
            "verification_method": bank.verification_method,
            "created_at": bank.created_at.isoformat(),
        }

    profile_data = None
    if user.kyc_profile:
        profile_data = user.kyc_profile.model_dump()

    return {
        "kyc_status": user.kyc_status,
        "kyc_profile": profile_data,
        "documents": doc_list,
        "bank_account": bank_data,
        "pan_verified": user.pan_verified,
        "bank_verified": user.bank_verified,
        "kyc_completed": user.kyc_completed,
    }
