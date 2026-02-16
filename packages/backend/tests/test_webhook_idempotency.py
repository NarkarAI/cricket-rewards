"""Tests for webhook event idempotency service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.webhook_service import is_event_processed, record_event, mark_processed


class TestWebhookIdempotency:
    @pytest.mark.asyncio
    async def test_new_event_not_processed(self):
        """New event IDs should return False."""
        with patch("app.services.webhook_service.WebhookEvent") as mock:
            mock.find_one = AsyncMock(return_value=None)
            result = await is_event_processed("evt_new_123")
        assert result is False

    @pytest.mark.asyncio
    async def test_existing_processed_event(self):
        """Already processed events should return True."""
        existing = MagicMock()
        existing.processed = True

        with patch("app.services.webhook_service.WebhookEvent") as mock:
            mock.find_one = AsyncMock(return_value=existing)
            result = await is_event_processed("evt_old_123")
        assert result is True

    @pytest.mark.asyncio
    async def test_existing_unprocessed_event(self):
        """Events recorded but not yet processed should return False."""
        existing = MagicMock()
        existing.processed = False

        with patch("app.services.webhook_service.WebhookEvent") as mock:
            mock.find_one = AsyncMock(return_value=existing)
            result = await is_event_processed("evt_pending_123")
        assert result is False

    @pytest.mark.asyncio
    async def test_record_event_creates_document(self):
        """record_event should create a new WebhookEvent document."""
        with patch("app.services.webhook_service.WebhookEvent") as mock:
            mock_instance = MagicMock()
            mock_instance.insert = AsyncMock()
            mock.return_value = mock_instance

            await record_event("evt_123", "stripe", "payment_intent.succeeded", {"id": "evt_123"})
            mock_instance.insert.assert_called_once()

    @pytest.mark.asyncio
    async def test_mark_processed_updates_event(self):
        """mark_processed should set processed=True on the event."""
        mock_event = MagicMock()
        mock_event.save = AsyncMock()

        with patch("app.services.webhook_service.WebhookEvent") as mock:
            mock.find_one = AsyncMock(return_value=mock_event)
            await mark_processed("evt_123")

        assert mock_event.processed is True
        mock_event.save.assert_called_once()

    @pytest.mark.asyncio
    async def test_mark_processed_with_error(self):
        """mark_processed with error should store the error string."""
        mock_event = MagicMock()
        mock_event.save = AsyncMock()

        with patch("app.services.webhook_service.WebhookEvent") as mock:
            mock.find_one = AsyncMock(return_value=mock_event)
            await mark_processed("evt_123", error="Processing failed")

        assert mock_event.processed is True
        assert mock_event.processing_error == "Processing failed"
