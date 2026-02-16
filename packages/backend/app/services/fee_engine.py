import time
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.fee_configuration import FeeConfiguration


class FeeCalculation(BaseModel):
    gross: Decimal
    fee: Decimal
    net: Decimal
    rate: Decimal


_cache: dict[str, tuple[FeeConfiguration, float]] = {}
CACHE_TTL = 60  # seconds


async def _get_active_config(currency: str) -> Optional[FeeConfiguration]:
    now = time.time()
    cached = _cache.get(currency)
    if cached and (now - cached[1]) < CACHE_TTL:
        return cached[0]

    config = await FeeConfiguration.find_one(
        FeeConfiguration.currency == currency,
        FeeConfiguration.is_active == True,
        sort=[("effective_from", -1)],
    )
    if config:
        _cache[currency] = (config, now)
    return config


async def calculate_fee(gross: Decimal, currency: str) -> FeeCalculation:
    config = await _get_active_config(currency)

    rate = config.rate if config else Decimal("0.05")
    min_fee = config.min_fee if config else Decimal("0.01")
    max_fee = config.max_fee if config else Decimal("500.00")

    fee = (gross * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    fee = max(min_fee, min(fee, max_fee))
    net = gross - fee

    return FeeCalculation(gross=gross, fee=fee, net=net, rate=rate)


def clear_cache():
    _cache.clear()
