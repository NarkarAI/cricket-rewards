from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from app.auth.dependencies import get_current_user, require_player
from app.models.user import User
from app.schemas.kyc import KycStatusResponse, KycUploadResponse
from app.services import kyc_service

router = APIRouter(prefix="/api/v1/kyc", tags=["kyc"])


@router.post("/upload", response_model=KycUploadResponse)
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(require_player),
):
    # In production, upload to S3/GCS. Here we store file info.
    file_key = f"kyc/{user.firebase_uid}/{document_type}/{file.filename}"
    doc = await kyc_service.upload_document(
        user_id=user.firebase_uid,
        document_type=document_type,
        file_key=file_key,
    )
    return KycUploadResponse(
        id=str(doc.id),
        document_type=doc.document_type,
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
            status=d.status,
            created_at=d.created_at,
        )
        for d in docs
    ]
