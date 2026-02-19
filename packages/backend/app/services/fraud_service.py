import time
from decimal import Decimal

import redis.asyncio as redis

from beanie.operators import In

from app.config import settings
from app.models.reward import Reward
from app.models.user import User

RATE_LIMITS = {
    "per_minute": (5, 60),
    "per_hour": (20, 3600),
    "per_day": (50, 86400),
}

DAILY_SPEND_CAPS = {
    "USD": Decimal("500.00"),
    "INR": Decimal("25000.00"),
}

LARGE_TRANSACTION_THRESHOLDS = {
    "USD": Decimal("200.00"),
    "INR": Decimal("10000.00"),
}

NEW_ACCOUNT_HOURS = 24


class FraudCheckResult:
    def __init__(self):
        self.score: float = 0.0
        self.flags: list[str] = []
        self.blocked: bool = False

    def add_flag(self, flag: str, weight: float):
        self.flags.append(flag)
        self.score = min(1.0, self.score + weight)

    def evaluate(self):
        if self.score > 0.8:
            self.blocked = True


async def check_rate_limit(redis_client: redis.Redis, user_id: str) -> list[str]:
    flags = []
    now = int(time.time())

    for limit_name, (max_count, window) in RATE_LIMITS.items():
        key = f"fraud:rate:{limit_name}:{user_id}"
        # Sliding window using sorted set
        await redis_client.zremrangebyscore(key, 0, now - window)
        count = await redis_client.zcard(key)
        if count >= max_count:
            flags.append(f"rate_limit_{limit_name}")
        else:
            await redis_client.zadd(key, {str(now): now})
            await redis_client.expire(key, window)

    return flags


async def check_velocity(user_id: str, amount: Decimal, currency: str) -> list[str]:
    flags = []
    from datetime import datetime, timedelta

    day_ago = datetime.utcnow() - timedelta(days=1)
    daily_rewards = await Reward.find(
        Reward.sender_id == user_id,
        Reward.created_at >= day_ago,
        In(Reward.status, ["completed", "payment_confirmed", "payment_pending"]),
    ).to_list()

    daily_total = sum(r.gross_amount for r in daily_rewards) + amount
    cap = DAILY_SPEND_CAPS.get(currency, Decimal("500.00"))
    if daily_total > cap:
        flags.append("daily_spend_cap_exceeded")

    return flags


def check_geo_mismatch(user: User, currency: str) -> list[str]:
    flags = []
    country = user.geo.country_code.upper()
    if country == "US" and currency == "INR":
        flags.append("geo_currency_mismatch")
    elif country == "IN" and currency == "USD":
        flags.append("geo_currency_mismatch")
    return flags


def check_new_account(user: User) -> list[str]:
    from datetime import datetime, timedelta

    flags = []
    if datetime.utcnow() - user.created_at < timedelta(hours=NEW_ACCOUNT_HOURS):
        flags.append("new_account")
    return flags


def check_large_transaction(amount: Decimal, currency: str) -> list[str]:
    flags = []
    threshold = LARGE_TRANSACTION_THRESHOLDS.get(currency, Decimal("200.00"))
    if amount > threshold:
        flags.append("large_transaction")
    return flags


async def run_fraud_checks(
    user: User,
    amount: Decimal,
    currency: str,
    redis_client: redis.Redis,
) -> FraudCheckResult:
    result = FraudCheckResult()

    # Rate limiting
    rate_flags = await check_rate_limit(redis_client, str(user.id))
    for flag in rate_flags:
        result.add_flag(flag, 0.3)

    # Velocity check
    velocity_flags = await check_velocity(str(user.id), amount, currency)
    for flag in velocity_flags:
        result.add_flag(flag, 0.4)

    # Geo mismatch
    geo_flags = check_geo_mismatch(user, currency)
    for flag in geo_flags:
        result.add_flag(flag, 0.3)

    # New account
    new_flags = check_new_account(user)
    for flag in new_flags:
        result.add_flag(flag, 0.2)

    # Large transaction
    large_flags = check_large_transaction(amount, currency)
    for flag in large_flags:
        result.add_flag(flag, 0.15)

    result.evaluate()
    return result
