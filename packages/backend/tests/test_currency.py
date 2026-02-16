"""Tests for currency utilities."""

from decimal import Decimal

from app.utils.currency import validate_reward_amount, round_currency


class TestValidateRewardAmount:
    def test_valid_usd_amount(self):
        valid, msg = validate_reward_amount(Decimal("50.00"), "USD")
        assert valid is True
        assert msg == ""

    def test_below_usd_minimum(self):
        valid, msg = validate_reward_amount(Decimal("0.50"), "USD")
        assert valid is False
        assert "minimum" in msg.lower() or "min" in msg.lower()

    def test_above_usd_maximum(self):
        valid, msg = validate_reward_amount(Decimal("15000.00"), "USD")
        assert valid is False
        assert "maximum" in msg.lower() or "max" in msg.lower()

    def test_valid_inr_amount(self):
        valid, msg = validate_reward_amount(Decimal("500.00"), "INR")
        assert valid is True

    def test_below_inr_minimum(self):
        valid, msg = validate_reward_amount(Decimal("10.00"), "INR")
        assert valid is False

    def test_unsupported_currency(self):
        valid, msg = validate_reward_amount(Decimal("50.00"), "EUR")
        assert valid is False
        assert "supported" in msg.lower() or "currency" in msg.lower()


class TestRoundCurrency:
    def test_rounds_to_two_decimals(self):
        assert round_currency(Decimal("10.126")) == Decimal("10.13")

    def test_half_rounds_up(self):
        assert round_currency(Decimal("10.125")) == Decimal("10.13")

    def test_already_rounded(self):
        assert round_currency(Decimal("10.50")) == Decimal("10.50")
