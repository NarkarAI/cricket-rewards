from decimal import Decimal

from pydantic import BaseModel


class PlayerSummary(BaseModel):
    id: str
    display_name: str
    avatar_url: str
    sport: str
    teams: list[str]
    bio: str
    nationality: str = ""
    profile_background: str = ""
    is_verified_player: bool = False
    kyc_status: str = "not_started"
    total_rewards_received: int = 0
    total_amount_received: Decimal = Decimal("0.00")


class PlayerDetail(PlayerSummary):
    pass
