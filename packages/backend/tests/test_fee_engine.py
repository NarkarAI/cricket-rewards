"""Tests for the fee engine service."""

from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

from app.services.fee_engine import calculate_fee, clear_cache, FeeCalculation


@pytest.fixture(autouse=True)
def clear_fee_cache():
    """Clear fee cache before each test."""
    clear_cache()
    yield
    clear_cache()


@pytest.mark.asyncio
async def test_default_5_percent_fee():
    """Without a DB config, the default 5% rate should apply."""
    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=None):
        result = await calculate_fee(Decimal("100.00"), "USD")

    assert result.gross == Decimal("100.00")
    assert result.fee == Decimal("5.00")
    assert result.net == Decimal("95.00")
    assert result.rate == Decimal("0.05")


@pytest.mark.asyncio
async def test_custom_rate():
    """A custom 10% rate from DB config."""
    config = MagicMock()
    config.rate = Decimal("0.10")
    config.min_fee = Decimal("0.01")
    config.max_fee = Decimal("500.00")

    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=config):
        result = await calculate_fee(Decimal("200.00"), "USD")

    assert result.fee == Decimal("20.00")
    assert result.net == Decimal("180.00")


@pytest.mark.asyncio
async def test_min_fee_applies():
    """When calculated fee is below minimum, min_fee should be used."""
    config = MagicMock()
    config.rate = Decimal("0.01")  # 1%
    config.min_fee = Decimal("1.00")
    config.max_fee = Decimal("500.00")

    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=config):
        result = await calculate_fee(Decimal("5.00"), "USD")

    # 1% of $5 = $0.05, but min is $1.00
    assert result.fee == Decimal("1.00")
    assert result.net == Decimal("4.00")


@pytest.mark.asyncio
async def test_max_fee_applies():
    """When calculated fee exceeds maximum, max_fee should cap it."""
    config = MagicMock()
    config.rate = Decimal("0.10")  # 10%
    config.min_fee = Decimal("0.01")
    config.max_fee = Decimal("50.00")

    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=config):
        result = await calculate_fee(Decimal("10000.00"), "USD")

    # 10% of $10000 = $1000, but max is $50
    assert result.fee == Decimal("50.00")
    assert result.net == Decimal("9950.00")


@pytest.mark.asyncio
async def test_rounding_half_up():
    """Fee should be rounded with ROUND_HALF_UP to 2 decimal places."""
    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=None):
        # 5% of $33.33 = $1.6665, rounds to $1.67
        result = await calculate_fee(Decimal("33.33"), "USD")

    assert result.fee == Decimal("1.67")
    assert result.net == Decimal("31.66")


@pytest.mark.asyncio
async def test_small_amount():
    """Test with a very small reward amount."""
    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=None):
        result = await calculate_fee(Decimal("1.00"), "USD")

    assert result.fee == Decimal("0.05")
    assert result.net == Decimal("0.95")


@pytest.mark.asyncio
async def test_inr_fee_calculation():
    """Test fee calculation with INR currency."""
    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=None):
        result = await calculate_fee(Decimal("500.00"), "INR")

    assert result.fee == Decimal("25.00")
    assert result.net == Decimal("475.00")


@pytest.mark.asyncio
async def test_fee_result_is_fee_calculation():
    """Result should be a proper FeeCalculation object."""
    with patch("app.services.fee_engine._get_active_config", new_callable=AsyncMock, return_value=None):
        result = await calculate_fee(Decimal("100.00"), "USD")

    assert isinstance(result, FeeCalculation)
    assert result.gross + Decimal("0") == result.fee + result.net  # gross = fee + net
