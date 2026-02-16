import stripe

from app.config import settings


def _get_stripe():
    stripe.api_key = settings.stripe_secret_key
    return stripe


async def create_payment_intent(
    amount_cents: int,
    currency: str,
    idempotency_key: str,
    metadata: dict | None = None,
) -> dict:
    """Create a Stripe PaymentIntent."""
    s = _get_stripe()
    intent = s.PaymentIntent.create(
        amount=amount_cents,
        currency=currency.lower(),
        metadata=metadata or {},
        idempotency_key=idempotency_key,
    )
    return {
        "payment_intent_id": intent.id,
        "client_secret": intent.client_secret,
    }


def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
    """Verify Stripe webhook signature and return the event."""
    s = _get_stripe()
    event = s.Webhook.construct_event(
        payload, sig_header, settings.stripe_webhook_secret
    )
    return event
