"""
Shared email notification client — one generic function used by every
booking type (prayer, satsang, bhadra, matri, savan). Sends via Brevo's
HTTPS email API (not SMTP) — Render's free tier blocks outbound SMTP
ports (25/465/587) as of Sept 2025, so a regular smtplib approach can
never work here without a paid Render instance. Brevo's API runs over
plain HTTPS, same as every other external call this app already makes
(Neon, Drive, Sheets), so it isn't affected by that block, and it's
free up to 300 emails/day — comfortably enough for this app's volume.

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
import httpx

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def email_configured() -> bool:
    return bool(os.getenv("BREVO_API_KEY")) and bool(os.getenv("GMAIL_ADDRESS"))


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


async def send_notification(suk_key: str, subject: str, html_body: str) -> None:
    """Low-level send — prefer send_booking_notification() below unless
    you need fully custom HTML."""
    if not email_configured():
        print(f"[email] Skipped — BREVO_API_KEY/GMAIL_ADDRESS not set.")
        return
    recipients = get_admin_emails(suk_key)
    if not recipients:
        print(f"[email] Skipped — no ADMIN_EMAILS_{suk_key.upper().replace('-', '_')} configured.")
        return

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                BREVO_API_URL,
                headers={
                    "api-key": os.getenv("BREVO_API_KEY", ""),
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "sender": {"email": os.getenv("GMAIL_ADDRESS", ""), "name": "Bannerghatta SUK — Booking System"},
                    "to": [{"email": addr} for addr in recipients],
                    "subject": subject,
                    "htmlContent": html_body,
                },
            )
            resp.raise_for_status()
        print(f"[email] Sent to {len(recipients)} recipient(s) for {suk_key}: {subject}")
    except Exception as e:
        # Logged here so it shows up in Render logs — callers still wrap
        # this in their own try/except so a failure here never blocks
        # the booking itself from succeeding.
        print(f"[email] FAILED for {suk_key}: {type(e).__name__}: {e}")


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