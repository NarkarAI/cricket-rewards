from datetime import datetime

from app.models.webhook_event import WebhookEvent


async def is_event_processed(event_id: str) -> bool:
    """Check if a webhook event has already been processed (idempotency)."""
    event = await WebhookEvent.find_one(WebhookEvent.event_id == event_id)
    return event is not None and event.processed


async def record_event(
    event_id: str,
    gateway: str,
    event_type: str,
    payload: dict,
) -> WebhookEvent:
    """Record a webhook event for idempotency tracking."""
    # Upsert to handle race conditions
    existing = await WebhookEvent.find_one(WebhookEvent.event_id == event_id)
    if existing:
        return existing

    event = WebhookEvent(
        event_id=event_id,
        gateway=gateway,
        event_type=event_type,
        payload=payload,
    )
    await event.insert()
    return event


async def mark_processed(event_id: str, error: str = "") -> None:
    """Mark a webhook event as processed."""
    event = await WebhookEvent.find_one(WebhookEvent.event_id == event_id)
    if event:
        event.processed = True
        event.processed_at = datetime.utcnow()
        event.processing_error = error
        await event.save()
