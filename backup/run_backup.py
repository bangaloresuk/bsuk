"""
Daily backup: Postgres → each SUK's own Google Sheet.

Read-only from the app's perspective — this never runs during a normal
request. It's meant to be triggered once a day (Render Cron Job, or run
manually) so your Sheets stay a fresh, human-browsable snapshot of
whatever's really in Postgres — nothing more.

Each SUK's spreadsheet ID comes from a per-SUK env var, same convention
as the photo folder IDs:
    BANNERGHATTA_SPREADSHEET_ID, BANASHANKARI_SPREADSHEET_ID, etc.

USAGE:
    python backup/run_backup.py            # backs up all SUKs
    python backup/run_backup.py --suk bannerghatta   # just one, for testing
"""
from __future__ import annotations

import sys
import os
import asyncio
import argparse
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from sqlalchemy import select
from backend.shared.db import get_session, db_configured
from backend.shared.db_models import Booking, EventBooking, Photo
from backend.shared.sheets_client import write_sheet_tab
from backend.shared.google_auth import google_configured

SPREADSHEET_ID_ENV = {
    "bannerghatta": "BANNERGHATTA_SPREADSHEET_ID",
    "banashankari": "BANASHANKARI_SPREADSHEET_ID",
    "electronic-city": "ELECTRONIC_CITY_SPREADSHEET_ID",
    "garvebhavi-palya": "GARVEBHAVI_PALYA_SPREADSHEET_ID",
    "marathahalli": "MARATHAHALLI_SPREADSHEET_ID",
    "peenya-2nd-stage": "PEENYA_SPREADSHEET_ID",
}

EVENT_TYPES = ["satsang", "bhadra", "matri", "savan"]
EVENT_SHEET_NAME = {"satsang": "Satsang", "bhadra": "Bhadra", "matri": "Matri", "savan": "Savan"}


def fmt_date(v) -> str:
    return v or ""


async def backup_bookings(session, suk_key: str, spreadsheet_id: str) -> int:
    result = await session.execute(select(Booking).where(Booking.suk_key == suk_key).order_by(Booking.id))
    rows = result.scalars().all()
    header = ["Booking ID", "Date", "Day", "Time Slot", "Person Name", "Mobile Number", "Place", "Maps Link", "Booked At"]
    values = [[
        str(r.id), fmt_date(r.date), r.day, r.time, r.name, r.mobile, r.place, r.maps_link,
        r.created_at.strftime("%d/%m/%Y, %H:%M:%S") if r.created_at else "",
    ] for r in rows]
    await write_sheet_tab(spreadsheet_id, "Bookings", header, values)
    return len(rows)


async def backup_event_type(session, suk_key: str, spreadsheet_id: str, event_type: str) -> int:
    result = await session.execute(
        select(EventBooking).where(
            EventBooking.suk_key == suk_key, EventBooking.event_type == event_type
        ).order_by(EventBooking.id)
    )
    rows = result.scalars().all()
    header = ["Satsang ID", "Date", "Time", "Host Name", "Mobile", "Venue", "Maps Link", "Hosted By", "Occasion", "Booked At"]
    values = [[
        str(r.id), fmt_date(r.date), r.time, r.name, r.mobile, r.venue, r.maps_link, r.hosted_by, r.occasion,
        r.created_at.strftime("%d/%m/%Y, %H:%M:%S") if r.created_at else "",
    ] for r in rows]
    await write_sheet_tab(spreadsheet_id, EVENT_SHEET_NAME[event_type], header, values)
    return len(rows)


async def backup_photos(session, suk_key: str, spreadsheet_id: str) -> int:
    result = await session.execute(select(Photo).where(Photo.suk_key == suk_key).order_by(Photo.created_at.desc()))
    rows = result.scalars().all()
    header = ["Photo ID", "Drive File ID", "View URL", "Caption", "Uploaded By", "Uploaded At"]
    values = [[
        str(r.id), r.drive_file_id, f"https://lh3.googleusercontent.com/d/{r.drive_file_id}",
        r.caption, r.uploader, r.created_at.strftime("%d/%m/%Y, %H:%M") if r.created_at else "",
    ] for r in rows]
    await write_sheet_tab(spreadsheet_id, "Photos", header, values)
    return len(rows)


async def backup_one_suk(suk_key: str) -> None:
    env_name = SPREADSHEET_ID_ENV.get(suk_key)
    spreadsheet_id = os.getenv(env_name, "") if env_name else ""
    if not spreadsheet_id:
        print(f"⏭  {suk_key}: no spreadsheet ID configured ({env_name}), skipping")
        return

    print(f"\n📍 {suk_key}  (writing to spreadsheet: {spreadsheet_id})")
    async with get_session() as session:
        total = 0
        try:
            n = await backup_bookings(session, suk_key, spreadsheet_id)
            print(f"    Bookings   → {n} row(s) written")
            total += n
        except Exception as e:
            print(f"    ⚠️  Bookings backup failed: {e}")

        for event_type in EVENT_TYPES:
            try:
                n = await backup_event_type(session, suk_key, spreadsheet_id, event_type)
                print(f"    {EVENT_SHEET_NAME[event_type]:10s} → {n} row(s) written")
                total += n
            except Exception as e:
                print(f"    ⚠️  {event_type} backup failed: {e}")

        try:
            n = await backup_photos(session, suk_key, spreadsheet_id)
            print(f"    Photos     → {n} row(s) written")
            total += n
        except Exception as e:
            print(f"    ⚠️  Photos backup failed: {e}")

    print(f"    ── {suk_key} total: {total} row(s) backed up")


async def main(only_suk: str | None):
    if not db_configured():
        print("❌ DATABASE_URL is not set.")
        return
    if not google_configured():
        print("❌ GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set.")
        return

    suks = [only_suk] if only_suk else list(SPREADSHEET_ID_ENV.keys())
    for suk_key in suks:
        await backup_one_suk(suk_key)

    print("\n✅ Backup run complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--suk", default=None, help="Back up just one SUK (for testing)")
    args = parser.parse_args()
    asyncio.run(main(args.suk))