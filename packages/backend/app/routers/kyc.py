from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from app.auth.dependencies import get_current_user, require_player, require_admin
from app.models.kyc_document import KycDocument
from app.models.user import User
from app.schemas.kyc import (
    BankAccountResponse,
    BankAccountSubmit,
    KycProfileSubmit,
    KycProfileResponse,
    KycStatusResponse,
    KycUploadResponse,
)
from app.services import kyc_service

router = APIRouter(prefix="/api/v1/kyc", tags=["kyc"])


@router.post("/upload", response_model=KycUploadResponse)
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(require_player),
):
    try:
        doc = await kyc_service.upload_document(
            user_id=user.firebase_uid,
            document_type=document_type,
            file=file,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return KycUploadResponse(
        id=str(doc.id),
        document_type=doc.document_type,
        file_name=doc.file_name,
        content_type=doc.content_type,
        status=doc.status,
        created_at=doc.created_at,
    )


@router.post("/submit")
async def submit_kyc(user: User = Depends(require_player)):
    try:
        status = await kyc_service.submit_kyc(user.firebase_uid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"kyc_status": status}


@router.get("/status", response_model=KycStatusResponse)
async def get_kyc_status(user: User = Depends(get_current_user)):
    docs = await kyc_service.get_user_documents(user.firebase_uid)
    return KycStatusResponse(
        kyc_status=user.kyc_status,
        documents=[
            KycUploadResponse(
                id=str(d.id),
                document_type=d.document_type,
                file_name=d.file_name,
                content_type=d.content_type,
                status=d.status,
                created_at=d.created_at,
            )
            for d in docs
        ],
    )


@router.get("/documents")
async def get_documents(user: User = Depends(get_current_user)):
    docs = await kyc_service.get_user_documents(user.firebase_uid)
    return [
        KycUploadResponse(
            id=str(d.id),
            document_type=d.document_type,
            file_name=d.file_name,
            content_type=d.content_type,
            status=d.status,
            created_at=d.created_at,
        )
        for d in docs
    ]


@router.get("/documents/{doc_id}/file")
async def get_document_file(doc_id: str, user: User = Depends(get_current_user)):
    """Serve a KYC document file. Players can view their own; admins can view any."""
    doc = await KycDocument.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Access control: owner or admin
    if doc.user_id != user.firebase_uid and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = kyc_service.get_file_path(doc.file_key)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        media_type=doc.content_type or "application/octet-stream",
        filename=doc.file_name,
    )


# --- Country-specific KYC ---


@router.post("/profile")
async def submit_kyc_profile(
    data: KycProfileSubmit,
    user: User = Depends(require_player),
):
    try:
        updated_user = await kyc_service.submit_kyc_profile(user.firebase_uid, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "status": "saved",
        "kyc_status": updated_user.kyc_status,
        "country": data.country,
    }


@router.post("/bank", response_model=BankAccountResponse)
async def submit_bank_account(
    data: BankAccountSubmit,
    user: User = Depends(require_player),
):
    try:
        bank = await kyc_service.submit_bank_account(user.firebase_uid, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BankAccountResponse(
        id=str(bank.id),
        country=bank.country,
        account_holder_name=bank.account_holder_name,
        account_number_last4=bank.account_number_last4,
        ifsc_code=bank.ifsc_code,
        upi_id=bank.upi_id,
        routing_number=bank.routing_number,
        account_type=bank.account_type,
        status=bank.status,
        verification_method=bank.verification_method,
        created_at=bank.created_at,
    )


@router.get("/bank")
async def get_bank_account(user: User = Depends(get_current_user)):
    bank = await kyc_service.get_user_bank_account(user.firebase_uid)
    if not bank:
        return None
    return BankAccountResponse(
        id=str(bank.id),
        country=bank.country,
        account_holder_name=bank.account_holder_name,
        account_number_last4=bank.account_number_last4,
        ifsc_code=bank.ifsc_code,
        upi_id=bank.upi_id,
        routing_number=bank.routing_number,
        account_type=bank.account_type,
        status=bank.status,
        verification_method=bank.verification_method,
        created_at=bank.created_at,
    )


@router.get("/full-status")
async def get_full_kyc_status(user: User = Depends(get_current_user)):
    try:
        return await kyc_service.get_full_kyc_status(user.firebase_uid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
