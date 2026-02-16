from datetime import datetime, timedelta
from decimal import Decimal

from app.models.reward import Reward

SINGLE_THRESHOLDS = {
    "USD": Decimal("3000.00"),
    "INR": Decimal("200000.00"),
}

DAILY_AGGREGATE_THRESHOLDS = {
    "USD": Decimal("10000.00"),
    "INR": Decimal("500000.00"),
}

STRUCTURING_RATIO_LOW = 0.80
STRUCTURING_RATIO_HIGH = 0.99
STRUCTURING_MIN_COUNT = 3


class AmlScreeningResult:
    def __init__(self):
        self.flagged: bool = False
        self.flags: list[str] = []

    def add_flag(self, flag: str):
        self.flags.append(flag)
        self.flagged = True


async def screen_transaction(
    user_id: str, amount: Decimal, currency: str
) -> AmlScreeningResult:
    result = AmlScreeningResult()

    # Single transaction threshold
    threshold = SINGLE_THRESHOLDS.get(currency, Decimal("3000.00"))
    if amount >= threshold:
        result.add_flag(f"single_transaction_threshold_{currency}")

    # Daily aggregate
    day_ago = datetime.utcnow() - timedelta(days=1)
    daily_rewards = await Reward.find(
        Reward.receiver_id == user_id,
        Reward.created_at >= day_ago,
        Reward.status == "completed",
    ).to_list()
    daily_total = sum(r.net_amount for r in daily_rewards) + amount
    daily_threshold = DAILY_AGGREGATE_THRESHOLDS.get(currency, Decimal("10000.00"))
    if daily_total >= daily_threshold:
        result.add_flag(f"daily_aggregate_threshold_{currency}")

    # Structuring detection: 3+ recent transactions at 80-99% of single threshold
    recent_rewards = await Reward.find(
        Reward.receiver_id == user_id,
        Reward.created_at >= day_ago,
        Reward.status == "completed",
    ).to_list()

    structuring_count = 0
    for r in recent_rewards:
        ratio = float(r.net_amount / threshold)
        if STRUCTURING_RATIO_LOW <= ratio <= STRUCTURING_RATIO_HIGH:
            structuring_count += 1

    # Also check current transaction
    current_ratio = float(amount / threshold)
    if STRUCTURING_RATIO_LOW <= current_ratio <= STRUCTURING_RATIO_HIGH:
        structuring_count += 1

    if structuring_count >= STRUCTURING_MIN_COUNT:
        result.add_flag("structuring_detected")

    return result
