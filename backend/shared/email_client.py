"""
Shared email notification client — one generic function used by every
booking type (prayer, satsang, bhadra, matri, savan). Sends via Gmail's
SMTP server using an App Password (GMAIL_ADDRESS + GMAIL_APP_PASSWORD).

Admin recipients are fully configurable per SUK through Render env vars
— no code change needed to add, remove, or change email addresses:

    ADMIN_EMAILS_BANNERGHATTA="a@gmail.com,b@gmail.com,c@gmail.com"
    ADMIN_EMAILS_BANASHANKARI="d@gmail.com"
    ADMIN_EMAILS_ELECTRONIC_CITY="..."
    ADMIN_EMAILS_GARVEBHAVI_PALYA="..."
    ADMIN_EMAILS_MARATHAHALLI="..."
    ADMIN_EMAILS_PEENYA_2ND_STAGE="..."

Comma-separated, any whitespace around each address is trimmed. A SUK
with no env var set (or an empty one) simply gets no email — everything
else about the booking still works normally either way.
"""
import os
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def email_configured() -> bool:
    return bool(os.getenv("GMAIL_ADDRESS")) and bool(os.getenv("GMAIL_APP_PASSWORD"))


def get_admin_emails(suk_key: str) -> list[str]:
    """Reads ADMIN_EMAILS_<SUK_KEY> (upper-cased, hyphens → underscores)
    e.g. suk_key='electronic-city' -> ADMIN_EMAILS_ELECTRONIC_CITY."""
    env_name = "ADMIN_EMAILS_" + suk_key.upper().replace("-", "_")
    raw = os.getenv(env_name, "")
    return [e.strip() for e in raw.split(",") if e.strip()]


def _build_html(title: str, color: str, fields: list[tuple]) -> str:
    rows = "".join(
        f'<tr><td style="color:#6b7280;padding:4px 0;padding-right:16px;'
        f'vertical-align:top;white-space:nowrap">{label}</td>'
        f'<td style="padding:4px 0">{value}</td></tr>'
        for label, value in fields if value
    )
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:{color};margin-bottom:16px">{title}</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse">{rows}</table>
      <p style="color:#9ca3af;font-size:11px;margin-top:20px">
        Jayguru — sent automatically by the booking system.
      </p>
    </div>
    """


def _send_sync(to_addrs: list[str], subject: str, html_body: str) -> None:
    sender = os.getenv("GMAIL_ADDRESS", "")
    app_password = os.getenv("GMAIL_APP_PASSWORD", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(to_addrs)
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(sender, app_password)
        server.sendmail(sender, to_addrs, msg.as_string())


async def send_notification(suk_key: str, subject: str, html_body: str) -> None:
    """Low-level send — prefer send_booking_notification() below unless
    you need fully custom HTML."""
    if not email_configured():
        return
    recipients = get_admin_emails(suk_key)
    if not recipients:
        return
    # smtplib is blocking — run it off the event loop so a slow SMTP
    # connection can never stall the request waiting on it.
    await asyncio.to_thread(_send_sync, recipients, subject, html_body)


async def send_booking_notification(
    suk_key: str, subject: str, title: str, fields: list[tuple], cancelled: bool = False
) -> None:
    """
    Generic notification for ANY booking type. `fields` is a list of
    (label, value) pairs shown as rows — e.g.:
        [("Booking ID", "42"), ("Person", "Name"), ("Date", "2026-08-23")]
    Callers should wrap this in try/except so an email hiccup never
    blocks or fails the booking itself.
    """
    color = "#b91c1c" if cancelled else "#1e3a8a"
    html = _build_html(title, color, fields)
    await send_notification(suk_key, subject, html)