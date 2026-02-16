from decimal import ROUND_HALF_UP, Decimal

SUPPORTED_CURRENCIES = {"USD", "INR"}

CURRENCY_CONFIG = {
    "USD": {"symbol": "$", "min_reward": Decimal("1.00"), "max_reward": Decimal("10000.00")},
    "INR": {"symbol": "₹", "min_reward": Decimal("50.00"), "max_reward": Decimal("500000.00")},
}


def round_currency(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def validate_reward_amount(amount: Decimal, currency: str) -> tuple[bool, str]:
    if currency not in SUPPORTED_CURRENCIES:
        return False, f"Unsupported currency: {currency}"
    config = CURRENCY_CONFIG[currency]
    if amount < config["min_reward"]:
        return False, f"Minimum reward is {config['symbol']}{config['min_reward']}"
    if amount > config["max_reward"]:
        return False, f"Maximum reward is {config['symbol']}{config['max_reward']}"
    return True, ""
