from fastapi import APIRouter, Depends, HTTPException, Query

import redis.asyncio as aioredis

from app.auth.dependencies import get_current_user
from app.dependencies import get_redis
from app.models.reward import Reward
from app.models.user import User
from app.schemas.reward import CreateRewardRequest, RewardResponse, RewardSummary
from app.services.reward_service import initiate_reward
from app.utils.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/rewards", tags=["rewards"])


@router.post("/", response_model=RewardResponse)
async def create_reward(
    req: CreateRewardRequest,
    user: User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    """Initiate a reward (creates reward + payment intent)."""
    try:
        result = await initiate_reward(
            sender=user,
            receiver_id=req.receiver_id,
            amount=req.amount,
            currency=req.currency,
            message=req.message,
            is_public=req.is_public,
            idempotency_key=req.idempotency_key,
            payment_gateway=req.payment_gateway,
            redis_client=redis_client,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    reward = result["reward"]
    return RewardResponse(
        id=str(reward.id),
        reward_id=reward.reward_id,
        sender_id=reward.sender_id,
        receiver_id=reward.receiver_id,
        gross_amount=reward.gross_amount,
        fee_amount=reward.fee_amount,
        net_amount=reward.net_amount,
        currency=reward.currency,
        message=reward.message,
        is_public=reward.is_public,
        payment_gateway=reward.payment_gateway,
        status=reward.status,
        created_at=reward.created_at,
        stripe_client_secret=result.get("stripe_client_secret"),
        razorpay_order_id=result.get("razorpay_order_id"),
        razorpay_key_id=result.get("razorpay_key_id"),
    )


@router.get("/sent")
async def get_sent_rewards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
):
    query = Reward.find(Reward.sender_id == str(user.id))
    total = await query.count()
    rewards = await query.sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()

    items = []
    for r in rewards:
        receiver = await User.get(r.receiver_id)
        items.append(
            RewardSummary(
                id=str(r.id),
                reward_id=r.reward_id,
                sender_name=user.display_name,
                receiver_name=receiver.display_name if receiver else "Unknown",
                gross_amount=r.gross_amount,
                net_amount=r.net_amount,
                currency=r.currency,
                message=r.message,
                status=r.status,
                created_at=r.created_at,
            )
        )

    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get("/received")
async def get_received_rewards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
):
    query = Reward.find(Reward.receiver_id == str(user.id))
    total = await query.count()
    rewards = await query.sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()

    items = []
    for r in rewards:
        sender = await User.get(r.sender_id)
        items.append(
            RewardSummary(
                id=str(r.id),
                reward_id=r.reward_id,
                sender_name=sender.display_name if sender else "Anonymous",
                receiver_name=user.display_name,
                gross_amount=r.gross_amount,
                net_amount=r.net_amount,
                currency=r.currency,
                message=r.message,
                status=r.status,
                created_at=r.created_at,
            )
        )

    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get("/{reward_id}", response_model=RewardResponse)
async def get_reward(reward_id: str, user: User = Depends(get_current_user)):
    reward = await Reward.find_one(Reward.reward_id == reward_id)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    # Only sender/receiver/admin can view
    user_id = str(user.id)
    if user.role != "admin" and reward.sender_id != user_id and reward.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return RewardResponse(
        id=str(reward.id),
        reward_id=reward.reward_id,
        sender_id=reward.sender_id,
        receiver_id=reward.receiver_id,
        gross_amount=reward.gross_amount,
        fee_amount=reward.fee_amount,
        net_amount=reward.net_amount,
        currency=reward.currency,
        message=reward.message,
        is_public=reward.is_public,
        payment_gateway=reward.payment_gateway,
        status=reward.status,
        created_at=reward.created_at,
    )
