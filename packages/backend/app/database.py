from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


async def init_db():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    from app.models.user import User
    from app.models.wallet import Wallet
    from app.models.ledger_entry import LedgerEntry
    from app.models.reward import Reward
    from app.models.kyc_document import KycDocument
    from app.models.bank_account import BankAccount
    from app.models.webhook_event import WebhookEvent
    from app.models.fee_configuration import FeeConfiguration

    await init_beanie(
        database=db,
        document_models=[
            User,
            Wallet,
            LedgerEntry,
            Reward,
            KycDocument,
            BankAccount,
            WebhookEvent,
            FeeConfiguration,
        ],
    )
