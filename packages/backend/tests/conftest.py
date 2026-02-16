import asyncio
from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import fakeredis.aioredis

from app.models.user import User
from app.models.wallet import Wallet
from app.models.reward import Reward
from app.models.fee_configuration import FeeConfiguration


@pytest.fixture
def redis_client():
    """Provide a fake Redis client for testing."""
    return fakeredis.aioredis.FakeRedis()


@pytest.fixture
def sample_user():
    """Create a sample spectator user (not persisted)."""
    user = MagicMock(spec=User)
    user.id = "user_spectator_123"
    user.firebase_uid = "firebase_spec_123"
    user.email = "spectator@example.com"
    user.display_name = "Test Spectator"
    user.role = "spectator"
    user.created_at = datetime(2024, 1, 1)  # Old account
    user.geo = MagicMock()
    user.geo.country_code = "US"
    user.geo.currency = "USD"
    return user


@pytest.fixture
def sample_player():
    """Create a sample player user (not persisted)."""
    user = MagicMock(spec=User)
    user.id = "user_player_456"
    user.firebase_uid = "firebase_player_456"
    user.email = "player@example.com"
    user.display_name = "Test Player"
    user.role = "player"
    user.is_verified_player = True
    user.created_at = datetime(2024, 1, 1)
    user.geo = MagicMock()
    user.geo.country_code = "IN"
    user.geo.currency = "INR"
    return user


@pytest.fixture
def new_user():
    """Create a new account (less than 24h old)."""
    user = MagicMock(spec=User)
    user.id = "user_new_789"
    user.firebase_uid = "firebase_new_789"
    user.role = "spectator"
    user.created_at = datetime.utcnow()  # Brand new
    user.geo = MagicMock()
    user.geo.country_code = "US"
    user.geo.currency = "USD"
    return user
