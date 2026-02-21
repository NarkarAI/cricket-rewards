"""Notification service for sending email and SMS on reward events."""

import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from twilio.rest import Client as TwilioClient

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def _twilio_client() -> TwilioClient | None:
    if settings.twilio_account_sid and settings.twilio_auth_token:
        return TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
    return None


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


def _send_sms_sync(to_number: str, body: str) -> None:
    client = _twilio_client()
    if not client:
        logger.warning("Twilio not configured — skipping SMS to %s", to_number)
        return
    try:
        client.messages.create(
            body=body,
            from_=settings.twilio_from_number,
            to=to_number,
        )
        logger.info("SMS sent to %s", to_number)
    except Exception:
        logger.exception("Failed to send SMS to %s", to_number)


async def _send_sms(to_number: str, body: str) -> None:
    if not to_number:
        logger.info("No phone number provided — skipping SMS")
        return
    if not to_number.startswith("+"):
        logger.warning("Invalid phone number (missing + country code): %s — skipping SMS", to_number)
        return
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_sms_sync, to_number, body)


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
        sender_sms = (
            f"RewardsByFan: Your reward of {amount_str} to "
            f"{receiver.display_name} was successful! Thank you for your support."
        )

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
        receiver_sms = (
            f"RewardsByFan: You received a reward of {net_str} from "
            f"{sender.display_name or 'a fan'}! Check your wallet."
        )

        # Fire all notifications concurrently
        await asyncio.gather(
            _send_email(sender.email, sender_subject, sender_html),
            _send_sms(sender.phone_number, sender_sms),
            _send_email(receiver.email, receiver_subject, receiver_html),
            _send_sms(receiver.phone_number, receiver_sms),
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
        sms_body = (
            f"RewardsByFan: Your reward of {amount_str} was unsuccessful. "
            f"Please try again."
        )

        await asyncio.gather(
            _send_email(sender.email, subject, html_body),
            _send_sms(sender.phone_number, sms_body),
            return_exceptions=True,
        )
    except Exception:
        logger.exception("Error sending reward failure notification for reward %s", reward.reward_id)
