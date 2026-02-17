from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import require_admin
from app.models.fee_configuration import FeeConfiguration
from app.models.kyc_document import KycDocument
from app.models.reward import Reward
from app.models.user import User
from app.models.wallet import Wallet
from app.realtime.emitter import emitter
from app.schemas.admin import AdminUserUpdate, AmlReviewRequest, FeeConfigRequest, FeeConfigResponse
from app.schemas.kyc import KycReviewRequest
from app.services import kyc_service, wallet_service
from app.services.fee_engine import clear_cache as clear_fee_cache
from app.utils.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# --- Users ---
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str = Query("", description="Filter by role"),
    admin: User = Depends(require_admin),
):
    query_filter = {}
    if role:
        query_filter["role"] = role

    total = await User.find(query_filter).count()
    users = (
        await User.find(query_filter)
        .sort("-created_at")
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )

    items = [
        {
            "id": str(u.id),
            "email": u.email,
            "display_name": u.display_name,
            "role": u.role,
            "kyc_status": u.kyc_status,
            "is_verified_player": u.is_verified_player,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    req: AdminUserUpdate,
    admin: User = Depends(require_admin),
):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.role:
        user.role = req.role
    if req.is_verified_player is not None:
        user.is_verified_player = req.is_verified_player
    if req.kyc_status:
        user.kyc_status = req.kyc_status
    user.updated_at = datetime.utcnow()
    await user.save()

    return {"status": "updated", "user_id": user_id}


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    req: AdminUserUpdate,
    admin: User = Depends(require_admin),
):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.kyc_status:
        user.kyc_status = req.kyc_status
    if req.is_verified_player is not None:
        user.is_verified_player = req.is_verified_player
    user.updated_at = datetime.utcnow()
    await user.save()

    return {"status": "updated"}


# --- KYC ---
@router.get("/kyc/pending")
async def list_pending_kyc(admin: User = Depends(require_admin)):
    docs = await kyc_service.get_pending_reviews()
    items = []
    for d in docs:
        user = await User.find_one(User.firebase_uid == d.user_id)
        items.append({
            "id": str(d.id),
            "user_id": d.user_id,
            "user_email": user.email if user else "",
            "user_name": user.display_name if user else "",
            "document_type": d.document_type,
            "file_name": d.file_name,
            "content_type": d.content_type,
            "file_key": d.file_key,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
        })
    return items


@router.patch("/kyc/{doc_id}/review")
async def review_kyc(
    doc_id: str,
    req: KycReviewRequest,
    admin: User = Depends(require_admin),
):
    try:
        doc = await kyc_service.review_document(
            doc_id=doc_id,
            reviewer_id=str(admin.id),
            status=req.status,
            notes=req.review_notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Emit KYC status update
    await emitter.emit_kyc_status(doc.user_id, req.status)

    return {"status": "reviewed", "doc_id": doc_id, "new_status": req.status}


# --- Finance ---
@router.get("/transactions")
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
):
    from app.models.ledger_entry import LedgerEntry

    total = await LedgerEntry.find_all().count()
    entries = (
        await LedgerEntry.find_all()
        .sort("-created_at")
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )
    items = [
        {
            "entry_id": e.entry_id,
            "user_id": e.user_id,
            "entry_type": e.entry_type,
            "direction": e.direction,
            "amount": str(e.amount),
            "currency": e.currency,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get("/rewards")
async def list_all_rewards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query("", description="Filter by status"),
    admin: User = Depends(require_admin),
):
    query_filter = {}
    if status:
        query_filter["status"] = status

    total = await Reward.find(query_filter).count()
    rewards = (
        await Reward.find(query_filter)
        .sort("-created_at")
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )
    items = [
        {
            "reward_id": r.reward_id,
            "sender_id": r.sender_id,
            "receiver_id": r.receiver_id,
            "gross_amount": str(r.gross_amount),
            "fee_amount": str(r.fee_amount),
            "net_amount": str(r.net_amount),
            "currency": r.currency,
            "status": r.status,
            "payment_gateway": r.payment_gateway,
            "fraud_score": r.fraud_score,
            "created_at": r.created_at.isoformat(),
        }
        for r in rewards
    ]
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get("/fees")
async def list_fee_configs(admin: User = Depends(require_admin)):
    configs = await FeeConfiguration.find_all().sort("-created_at").to_list()
    return [
        FeeConfigResponse(
            id=str(c.id),
            rate=c.rate,
            min_fee=c.min_fee,
            max_fee=c.max_fee,
            currency=c.currency,
            is_active=c.is_active,
            effective_from=c.effective_from.isoformat(),
            created_by=c.created_by,
        )
        for c in configs
    ]


@router.post("/fees", response_model=FeeConfigResponse)
async def create_fee_config(
    req: FeeConfigRequest,
    admin: User = Depends(require_admin),
):
    # Deactivate existing configs for this currency
    existing = await FeeConfiguration.find(
        FeeConfiguration.currency == req.currency, FeeConfiguration.is_active == True
    ).to_list()
    for c in existing:
        c.is_active = False
        await c.save()

    config = FeeConfiguration(
        rate=req.rate,
        min_fee=req.min_fee,
        max_fee=req.max_fee,
        currency=req.currency,
        created_by=str(admin.id),
    )
    await config.insert()
    clear_fee_cache()

    return FeeConfigResponse(
        id=str(config.id),
        rate=config.rate,
        min_fee=config.min_fee,
        max_fee=config.max_fee,
        currency=config.currency,
        is_active=config.is_active,
        effective_from=config.effective_from.isoformat(),
        created_by=config.created_by,
    )


# --- AML ---
@router.get("/aml/flagged")
async def list_aml_flagged(admin: User = Depends(require_admin)):
    """List rewards with funds in pending balance (AML-flagged)."""
    wallets = await Wallet.find(Wallet.pending_balance > Decimal("0")).to_list()
    items = []
    for w in wallets:
        user = await User.find_one({"_id": w.user_id}) if not w.user_id.startswith("platform") else None
        rewards = await Reward.find(
            Reward.receiver_id == w.user_id, Reward.status == "completed"
        ).to_list()
        items.append({
            "user_id": w.user_id,
            "user_email": user.email if user else "",
            "pending_balance": str(w.pending_balance),
            "currency": w.currency,
            "flagged_rewards": len(rewards),
        })
    return items


@router.patch("/aml/{user_id}/review")
async def review_aml(
    user_id: str,
    req: AmlReviewRequest,
    admin: User = Depends(require_admin),
):
    wallet = await Wallet.find_one(Wallet.user_id == user_id)
    if not wallet or wallet.pending_balance <= 0:
        raise HTTPException(status_code=404, detail="No pending funds for this user")

    if req.action == "approve":
        await wallet_service.release_pending_to_available(user_id, wallet.pending_balance)
        wallet = await Wallet.find_one(Wallet.user_id == user_id)
        await emitter.emit_wallet_update(user_id, wallet)
        return {"status": "approved", "released": str(wallet.available_balance)}
    elif req.action == "reject":
        # Funds remain in pending; in production, initiate refund
        return {"status": "rejected", "pending": str(wallet.pending_balance)}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
