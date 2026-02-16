from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.wallet import LedgerEntryResponse, WalletResponse, WithdrawRequest
from app.services import ledger_service, wallet_service
from app.utils.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/wallets", tags=["wallets"])


@router.get("/me", response_model=WalletResponse)
async def get_my_wallet(user: User = Depends(get_current_user)):
    wallet = await wallet_service.get_or_create_wallet(str(user.id))
    return WalletResponse(
        user_id=wallet.user_id,
        currency=wallet.currency,
        available_balance=wallet.available_balance,
        pending_balance=wallet.pending_balance,
        held_balance=wallet.held_balance,
        lifetime_received=wallet.lifetime_received,
        lifetime_sent=wallet.lifetime_sent,
    )


@router.get("/me/history")
async def get_wallet_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
):
    entries, total = await ledger_service.get_user_entries(
        str(user.id), skip=(page - 1) * page_size, limit=page_size
    )
    items = [
        LedgerEntryResponse(
            entry_id=e.entry_id,
            entry_type=e.entry_type,
            direction=e.direction,
            amount=e.amount,
            currency=e.currency,
            balance_after=e.balance_after,
            description=e.description,
            created_at=e.created_at,
        )
        for e in entries
    ]
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.post("/withdraw")
async def withdraw(req: WithdrawRequest, user: User = Depends(get_current_user)):
    try:
        wallet = await wallet_service.debit_available(str(user.id), req.amount)
        await ledger_service.record_withdrawal(str(user.id), req.amount, req.currency)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "initiated",
        "amount": str(req.amount),
        "currency": req.currency,
        "available_balance": str(wallet.available_balance),
    }
