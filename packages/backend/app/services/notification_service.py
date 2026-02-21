"""Notification service for sending email and push notifications on reward events."""

import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from firebase_admin import messaging

from app.auth.firebase import init_firebase
from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    if not _smtp_configured():
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
        )
        logger.info("Email sent to %s: %s", to_email, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def _send_push_sync(tokens: list[str], title: str, body: str) -> list[str]:
    """Send push notification to FCM tokens. Returns list of stale tokens to remove."""
    if not tokens:
        return []
    init_firebase()
    messages = [
        messaging.Message(
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon="/icons/icon-192.png",
                ),
            ),
            token=token,
        )
        for token in tokens
    ]
    stale_tokens = []
    try:
        response = messaging.send_each(messages)
        logger.info(
            "Push sent: %d success, %d failure",
            response.success_count,
            response.failure_count,
        )
        # Collect stale tokens for cleanup
        for i, send_response in enumerate(response.responses):
            if send_response.exception and "NotRegistered" in str(send_response.exception):
                stale_tokens.append(tokens[i])
    except Exception:
        logger.exception("Failed to send push notifications")
    return stale_tokens


async def _send_push(user_id: str, title: str, body: str) -> None:
    """Send push notification to all of a user's devices."""
    user = await User.get(user_id)
    if not user or not user.fcm_tokens:
        logger.info("No FCM tokens for user %s — skipping push", user_id)
        return
    loop = asyncio.get_event_loop()
    stale = await loop.run_in_executor(None, _send_push_sync, user.fcm_tokens, title, body)
    # Auto-clean stale tokens
    if stale:
        user.fcm_tokens = [t for t in user.fcm_tokens if t not in stale]
        await user.save()
        logger.info("Removed %d stale FCM token(s) for user %s", len(stale), user_id)


def _format_amount(amount, currency: str) -> str:
    symbol = "₹" if currency == "INR" else "$"
    return f"{symbol}{amount}"


async def notify_reward_success(reward) -> None:
    """Send success notifications to both spectator (sender) and player (receiver)."""
    try:
        sender = await User.get(reward.sender_id)
        receiver = await User.get(reward.receiver_id)
        if not sender or not receiver:
            logger.error("Cannot send notifications: sender or receiver not found for reward %s", reward.reward_id)
            return

        amount_str = _format_amount(reward.gross_amount, reward.currency)
        net_str = _format_amount(reward.net_amount, reward.currency)

        # --- Spectator (sender) notifications ---
        sender_subject = "Your Reward Was Successful! - RewardsByFan"
        sender_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Reward Successful!</h2>
            <p>Hi {sender.display_name or 'there'},</p>
            <p>Your reward of <strong>{amount_str}</strong> to
            <strong>{receiver.display_name}</strong> was successful!</p>
            <p>Thank you for supporting your favorite player.</p>
            <br>
            <p style="color: #666; font-size: 14px;">— The RewardsByFan Team</p>
        </div>
        """
        sender_push_title = "Reward Successful!"
        sender_push_body = f"Your reward of {amount_str} to {receiver.display_name} was successful!"

        # --- Player (receiver) notifications ---
        receiver_subject = "You Received a Reward! - RewardsByFan"
        receiver_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Reward Received!</h2>
            <p>Hi {receiver.display_name or 'there'},</p>
            <p>Great news! You received a reward of <strong>{net_str}</strong>
            from <strong>{sender.display_name or 'a fan'}</strong>!</p>
            {f'<p>Message: <em>"{reward.message}"</em></p>' if reward.message else ''}
            <p>The amount has been added to your wallet.</p>
            <br>
            <p style="color: #666; font-size: 14px;">— The RewardsByFan Team</p>
        </div>
        """
        receiver_push_title = "New Reward Received!"
        receiver_push_body = f"You received {net_str} from {sender.display_name or 'a fan'}!"

        # Fire all notifications concurrently
        await asyncio.gather(
            _send_email(sender.email, sender_subject, sender_html),
            _send_push(reward.sender_id, sender_push_title, sender_push_body),
            _send_email(receiver.email, receiver_subject, receiver_html),
            _send_push(reward.receiver_id, receiver_push_title, receiver_push_body),
            return_exceptions=True,
        )
    except Exception:
        logger.exception("Error sending reward success notifications for reward %s", reward.reward_id)


async def notify_reward_failure(reward) -> None:
    """Send failure notification to spectator (sender) only."""
    try:
        sender = await User.get(reward.sender_id)
        if not sender:
            logger.error("Cannot send failure notification: sender not found for reward %s", reward.reward_id)
            return

        amount_str = _format_amount(reward.gross_amount, reward.currency)

        subject = "Your Reward Was Unsuccessful - RewardsByFan"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Reward Unsuccessful</h2>
            <p>Hi {sender.display_name or 'there'},</p>
            <p>Unfortunately, your reward of <strong>{amount_str}</strong> was unsuccessful.
            Please try again.</p>
            <p>If you continue to experience issues, please contact our support team.</p>
            <br>
            <p style="color: #666; font-size: 14px;">— The RewardsByFan Team</p>
        </div>
        """
        push_title = "Reward Unsuccessful"
        push_body = f"Your reward of {amount_str} was unsuccessful. Please try again."

        await asyncio.gather(
            _send_email(sender.email, subject, html_body),
            _send_push(reward.sender_id, push_title, push_body),
            return_exceptions=True,
        )
    except Exception:
        logger.exception("Error sending reward failure notification for reward %s", reward.reward_id)
