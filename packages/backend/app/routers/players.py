from fastapi import APIRouter, HTTPException, Query

from app.models.reward import Reward
from app.models.user import User
from app.schemas.player import PlayerDetail, PlayerSummary
from app.utils.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/players", tags=["players"])


@router.get("/")
async def list_players(
    search: str = Query("", description="Search by name, sport, or team"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all players with pagination and search."""
    query_filter = {"role": "player"}

    if search:
        query_filter["$or"] = [
            {"display_name": {"$regex": search, "$options": "i"}},
            {"sport": {"$regex": search, "$options": "i"}},
            {"teams": {"$regex": search, "$options": "i"}},
        ]

    total = await User.find(query_filter).count()
    users = (
        await User.find(query_filter)
        .sort("-created_at")
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )

    items = []
    for u in users:
        reward_count = await Reward.find(
            Reward.receiver_id == str(u.id), Reward.status == "completed"
        ).count()
        items.append(
            PlayerSummary(
                id=str(u.id),
                display_name=u.display_name,
                avatar_url=u.avatar_url,
                sport=u.sport,
                teams=u.teams,
                bio=u.bio,
                nationality=u.nationality,
                profile_background=u.profile_background,
                is_verified_player=u.is_verified_player,
                kyc_status=u.kyc_status,
                total_rewards_received=reward_count,
            )
        )

    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get("/{player_id}", response_model=PlayerDetail)
async def get_player(player_id: str):
    user = await User.get(player_id)
    if not user or user.role != "player":
        raise HTTPException(status_code=404, detail="Player not found")

    reward_count = await Reward.find(
        Reward.receiver_id == player_id, Reward.status == "completed"
    ).count()

    return PlayerDetail(
        id=str(user.id),
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        sport=user.sport,
        teams=user.teams,
        bio=user.bio,
        nationality=user.nationality,
        profile_background=user.profile_background,
        is_verified_player=user.is_verified_player,
        kyc_status=user.kyc_status,
        total_rewards_received=reward_count,
    )


@router.get("/{player_id}/rewards")
async def get_player_rewards(
    player_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Public rewards feed for a player."""
    query = Reward.find(
        Reward.receiver_id == player_id,
        Reward.status == "completed",
        Reward.is_public == True,
    )
    total = await query.count()
    rewards = await query.sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()

    items = []
    for r in rewards:
        sender = await User.get(r.sender_id)
        items.append({
            "reward_id": r.reward_id,
            "sender_name": sender.display_name if sender else "Anonymous",
            "gross_amount": str(r.gross_amount),
            "currency": r.currency,
            "message": r.message,
            "created_at": r.created_at.isoformat(),
        })

    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)
