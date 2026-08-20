"""
Shared timezone helper. All timestamps are stored in the database as UTC
(datetime.utcnow(), the sensible default for a database) — but the old
Apps Script always displayed times in "Asia/Kolkata" (IST, UTC+5:30),
and the frontend expects that same local time. Convert at display time,
never change what's stored.
"""
from datetime import datetime, timedelta

IST_OFFSET = timedelta(hours=5, minutes=30)


def to_ist_str(dt: datetime, fmt: str) -> str:
    """Converts a naive UTC datetime to an IST-formatted string.
    Returns '' if dt is None, so callers can use this unconditionally."""
    if dt is None:
        return ""
    return (dt + IST_OFFSET).strftime(fmt)