from decimal import Decimal

from app.models.ledger_entry import LedgerEntry
from app.models.wallet import Wallet


async def _get_balance(user_id: str) -> Decimal:
    wallet = await Wallet.find_one(Wallet.user_id == user_id)
    return wallet.available_balance if wallet else Decimal("0.00")


async def record_reward_sent(
    user_id: str,
    reward_id: str,
    amount: Decimal,
    currency: str,
    related_entry_ids: list[str] | None = None,
) -> LedgerEntry:
    balance_after = await _get_balance(user_id)
    entry = LedgerEntry(
        reward_id=reward_id,
        user_id=user_id,
        entry_type="reward_sent",
        direction="debit",
        amount=amount,
        currency=currency,
        balance_after=balance_after,
        related_entry_ids=related_entry_ids or [],
        description=f"Reward sent: {currency} {amount}",
    )
    await entry.insert()
    return entry


async def record_reward_received(
    user_id: str,
    reward_id: str,
    amount: Decimal,
    currency: str,
    related_entry_ids: list[str] | None = None,
) -> LedgerEntry:
    balance_after = await _get_balance(user_id)
    entry = LedgerEntry(
        reward_id=reward_id,
        user_id=user_id,
        entry_type="reward_received",
        direction="credit",
        amount=amount,
        currency=currency,
        balance_after=balance_after,
        related_entry_ids=related_entry_ids or [],
        description=f"Reward received: {currency} {amount}",
    )
    await entry.insert()
    return entry


async def record_platform_fee(
    reward_id: str,
    amount: Decimal,
    currency: str,
    related_entry_ids: list[str] | None = None,
) -> LedgerEntry:
    entry = LedgerEntry(
        reward_id=reward_id,
        user_id="platform",
        entry_type="platform_fee",
        direction="credit",
        amount=amount,
        currency=currency,
        balance_after=Decimal("0.00"),  # Platform balance tracked separately
        related_entry_ids=related_entry_ids or [],
        description=f"Platform fee: {currency} {amount}",
    )
    await entry.insert()
    return entry


async def record_withdrawal(
    user_id: str,
    amount: Decimal,
    currency: str,
) -> LedgerEntry:
    balance_after = await _get_balance(user_id)
    entry = LedgerEntry(
        user_id=user_id,
        entry_type="withdrawal",
        direction="debit",
        amount=amount,
        currency=currency,
        balance_after=balance_after,
        description=f"Withdrawal: {currency} {amount}",
    )
    await entry.insert()
    return entry


async def get_user_entries(
    user_id: str, skip: int = 0, limit: int = 20
) -> tuple[list[LedgerEntry], int]:
    query = LedgerEntry.find(LedgerEntry.user_id == user_id)
    total = await query.count()
    entries = await query.sort("-created_at").skip(skip).limit(limit).to_list()
    return entries, total
