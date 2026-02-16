from datetime import datetime
from typing import Any, Optional

from beanie import Document, Indexed
from pydantic import Field


class WebhookEvent(Document):
    event_id: Indexed(str, unique=True)
    gateway: str  # stripe | razorpay
    event_type: str
    payload: dict[str, Any] = Field(default_factory=dict)

    processed: bool = False
    processed_at: Optional[datetime] = None
    processing_error: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "webhook_events"
