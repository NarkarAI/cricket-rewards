"""Tests for the fraud detection service."""

from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.fraud_service import (
    FraudCheckResult,
    check_geo_mismatch,
    check_large_transaction,
    check_new_account,
    check_rate_limit,
    check_velocity,
    run_fraud_checks,
)


class TestFraudCheckResult:
    def test_initial_state(self):
        result = FraudCheckResult()
        assert result.score == 0.0
        assert result.flags == []
        assert result.blocked is False

    def test_add_flag_increases_score(self):
        result = FraudCheckResult()
        result.add_flag("test_flag", 0.3)
        assert result.score == 0.3
        assert "test_flag" in result.flags

    def test_score_capped_at_1(self):
        result = FraudCheckResult()
        result.add_flag("a", 0.6)
        result.add_flag("b", 0.6)
        assert result.score == 1.0

    def test_evaluate_blocks_above_threshold(self):
        result = FraudCheckResult()
        result.add_flag("a", 0.5)
        result.add_flag("b", 0.4)  # total 0.9
        result.evaluate()
        assert result.blocked is True

    def test_evaluate_does_not_block_below_threshold(self):
        result = FraudCheckResult()
        result.add_flag("a", 0.3)
        result.evaluate()
        assert result.blocked is False


class TestGeoMismatch:
    def test_us_user_inr_currency_flagged(self, sample_user):
        flags = check_geo_mismatch(sample_user, "INR")
        assert "geo_currency_mismatch" in flags

    def test_us_user_usd_currency_ok(self, sample_user):
        flags = check_geo_mismatch(sample_user, "USD")
        assert flags == []

    def test_in_user_usd_currency_flagged(self, sample_player):
        flags = check_geo_mismatch(sample_player, "USD")
        assert "geo_currency_mismatch" in flags

    def test_in_user_inr_currency_ok(self, sample_player):
        flags = check_geo_mismatch(sample_player, "INR")
        assert flags == []


class TestNewAccount:
    def test_new_account_flagged(self, new_user):
        flags = check_new_account(new_user)
        assert "new_account" in flags

    def test_old_account_not_flagged(self, sample_user):
        flags = check_new_account(sample_user)
        assert flags == []


class TestLargeTransaction:
    def test_large_usd_flagged(self):
        flags = check_large_transaction(Decimal("201.00"), "USD")
        assert "large_transaction" in flags

    def test_normal_usd_ok(self):
        flags = check_large_transaction(Decimal("100.00"), "USD")
        assert flags == []

    def test_large_inr_flagged(self):
        flags = check_large_transaction(Decimal("10001.00"), "INR")
        assert "large_transaction" in flags

    def test_normal_inr_ok(self):
        flags = check_large_transaction(Decimal("5000.00"), "INR")
        assert flags == []

    def test_exact_threshold_not_flagged(self):
        flags = check_large_transaction(Decimal("200.00"), "USD")
        assert flags == []


class TestRateLimit:
    @pytest.mark.asyncio
    async def test_under_limit_no_flags(self, redis_client):
        flags = await check_rate_limit(redis_client, "user_1")
        assert flags == []

    @pytest.mark.asyncio
    async def test_exceeds_per_minute_limit(self, redis_client):
        # Fire 5 requests (at the limit)
        for _ in range(5):
            await check_rate_limit(redis_client, "user_2")

        # 6th should flag
        flags = await check_rate_limit(redis_client, "user_2")
        assert "rate_limit_per_minute" in flags


class TestVelocity:
    @pytest.mark.asyncio
    async def test_under_daily_cap_no_flags(self):
        with patch("app.services.fraud_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[])
            flags = await check_velocity("user_1", Decimal("100.00"), "USD")
        assert flags == []

    @pytest.mark.asyncio
    async def test_exceeds_daily_cap_flagged(self):
        existing = MagicMock()
        existing.gross_amount = Decimal("450.00")

        with patch("app.services.fraud_service.Reward") as mock_reward:
            mock_reward.find.return_value.to_list = AsyncMock(return_value=[existing])
            # 450 existing + 100 new = 550, over $500 cap
            flags = await check_velocity("user_1", Decimal("100.00"), "USD")
        assert "daily_spend_cap_exceeded" in flags


class TestRunFraudChecks:
    @pytest.mark.asyncio
    async def test_clean_user_passes(self, sample_user, redis_client):
        with patch("app.services.fraud_service.check_velocity", new_callable=AsyncMock, return_value=[]):
            result = await run_fraud_checks(
                sample_user, Decimal("50.00"), "USD", redis_client
            )
        assert result.blocked is False
        assert result.score < 0.8

    @pytest.mark.asyncio
    async def test_multiple_flags_can_block(self, new_user, redis_client):
        """New account + geo mismatch + large transaction should block."""
        new_user.geo.country_code = "US"

        with patch("app.services.fraud_service.check_velocity", new_callable=AsyncMock,
                    return_value=["daily_spend_cap_exceeded"]):
            result = await run_fraud_checks(
                new_user, Decimal("300.00"), "INR", redis_client
            )
        # new_account (0.2) + geo_mismatch (0.3) + daily_cap (0.4) + large_txn (0.15) = 1.05 -> capped at 1.0
        assert result.blocked is True
        assert len(result.flags) >= 3
