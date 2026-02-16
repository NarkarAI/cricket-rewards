"""Tests for the AML screening service."""

from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.aml_service import (
    AmlScreeningResult,
    SINGLE_THRESHOLDS,
    DAILY_AGGREGATE_THRESHOLDS,
    screen_transaction,
)


class TestAmlScreeningResult:
    def test_initial_state(self):
        result = AmlScreeningResult()
        assert result.flagged is False
        assert result.flags == []

    def test_add_flag_sets_flagged(self):
        result = AmlScreeningResult()
        result.add_flag("test")
        assert result.flagged is True
        assert "test" in result.flags


class TestScreenTransaction:
    @pytest.mark.asyncio
    async def test_small_transaction_passes(self):
        """Transactions well under thresholds should pass."""
        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[])
            result = await screen_transaction("user_1", Decimal("100.00"), "USD")

        assert result.flagged is False
        assert result.flags == []

    @pytest.mark.asyncio
    async def test_single_transaction_threshold_usd(self):
        """USD transaction >= $3000 should be flagged."""
        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[])
            result = await screen_transaction("user_1", Decimal("3000.00"), "USD")

        assert result.flagged is True
        assert "single_transaction_threshold_USD" in result.flags

    @pytest.mark.asyncio
    async def test_single_transaction_threshold_inr(self):
        """INR transaction >= 200000 should be flagged."""
        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[])
            result = await screen_transaction("user_1", Decimal("200000.00"), "INR")

        assert result.flagged is True
        assert "single_transaction_threshold_INR" in result.flags

    @pytest.mark.asyncio
    async def test_daily_aggregate_threshold(self):
        """Daily total crossing $10000 should flag."""
        existing = MagicMock()
        existing.net_amount = Decimal("8000.00")

        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[existing])
            # 8000 existing + 3000 new = 11000, over $10000
            result = await screen_transaction("user_1", Decimal("3000.00"), "USD")

        assert result.flagged is True
        assert any("daily_aggregate" in f for f in result.flags)

    @pytest.mark.asyncio
    async def test_structuring_detection(self):
        """3+ transactions at 80-99% of threshold should flag structuring."""
        threshold = SINGLE_THRESHOLDS["USD"]  # $3000

        # Create 3 existing transactions at ~85% of threshold
        existing_rewards = []
        for _ in range(3):
            r = MagicMock()
            r.net_amount = Decimal("2550.00")  # 85% of $3000
            existing_rewards.append(r)

        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=existing_rewards)
            # Current transaction also at 85%
            result = await screen_transaction("user_1", Decimal("2550.00"), "USD")

        assert result.flagged is True
        assert "structuring_detected" in result.flags

    @pytest.mark.asyncio
    async def test_no_structuring_below_count(self):
        """Only 1-2 near-threshold transactions should NOT flag structuring."""
        existing = MagicMock()
        existing.net_amount = Decimal("2550.00")

        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[existing])
            result = await screen_transaction("user_1", Decimal("100.00"), "USD")

        assert "structuring_detected" not in result.flags

    @pytest.mark.asyncio
    async def test_just_below_threshold_passes(self):
        """Transaction just below $3000 should not flag single threshold."""
        with patch("app.services.aml_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[])
            result = await screen_transaction("user_1", Decimal("2999.99"), "USD")

        assert "single_transaction_threshold_USD" not in result.flags
