"""
Table definitions for Postgres (Neon).

Every table carries a `suk_key` column (e.g. 'bannerghatta', 'banashankari').
This is how the 6 SUKs share ONE database safely — every query a service
makes is filtered by suk_key, so one SUK's rows are never visible to
another's requests. See backend/shared/auth.py for how suk_key is
validated on each incoming request; that validated value is what gets
passed down into every query here.

id columns are plain auto-incrementing integers per table — since each
table is now scoped by suk_key, there's no cross-sheet id collision risk
the way there was when everything briefly shared editingAddress keys on
the frontend during the Google-Sheets era.
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Booking(Base):
    """Prayer bookings — the original 'Bookings' sheet."""
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    suk_key: Mapped[str] = mapped_column(String(64), index=True)

    name: Mapped[str] = mapped_column(String(120))
    mobile: Mapped[str] = mapped_column(String(20))
    place: Mapped[str] = mapped_column(String(500), default="")
    maps_link: Mapped[str] = mapped_column(String(1000), default="")
    date: Mapped[str] = mapped_column(String(20))          # kept as 'YYYY-MM-DD' string to match existing frontend format
    time: Mapped[str] = mapped_column(String(20))          # 'Morning' / 'Evening'
    day: Mapped[str] = mapped_column(String(20), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_bookings_suk_mobile", "suk_key", "mobile"),
        Index("ix_bookings_suk_date", "suk_key", "date"),
    )


class EventBooking(Base):
    """
    Shared table for satsang / bhadra / matri / savan — they have identical
    shape (name, mobile, venue, mapsLink, date, time, hostedBy, occasion),
    so one table with an `event_type` column avoids 4 near-duplicate tables.
    This mirrors how the frontend already tags results with `_type`.
    """
    __tablename__ = "event_bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    suk_key: Mapped[str] = mapped_column(String(64), index=True)
    event_type: Mapped[str] = mapped_column(String(20), index=True)   # 'satsang' | 'bhadra' | 'matri' | 'savan'

    name: Mapped[str] = mapped_column(String(120))
    mobile: Mapped[str] = mapped_column(String(20))
    venue: Mapped[str] = mapped_column(String(500), default="")
    maps_link: Mapped[str] = mapped_column(String(1000), default="")
    date: Mapped[str] = mapped_column(String(20))
    time: Mapped[str] = mapped_column(String(20))
    hosted_by: Mapped[str] = mapped_column(String(120), default="")
    occasion: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_event_suk_type_mobile", "suk_key", "event_type", "mobile"),
        Index("ix_event_suk_type_date", "suk_key", "event_type", "date"),
    )


class Photo(Base):
    """Gallery metadata only — the actual image bytes live in Google Drive.
    drive_file_id is what drive_client.py uses to fetch/stream the real file."""
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    suk_key: Mapped[str] = mapped_column(String(64), index=True)

    drive_file_id: Mapped[str] = mapped_column(String(200))
    caption: Mapped[str] = mapped_column(String(500), default="")
    uploader: Mapped[str] = mapped_column(String(120), default="Anonymous")
    rotation: Mapped[int] = mapped_column(Integer, default=0)   # 0/90/180/270, matches existing rotate feature
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_photos_suk_created", "suk_key", "created_at"),
    )
