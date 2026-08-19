"""
ONE-TIME migration script.
Pulls every existing row from all 6 SUKs' Google Sheets (via the same
gas_post() calls the live app already uses) and inserts them into the new
Postgres tables (bookings, event_bookings).

Photos are NOT migrated here — that happens in a separate step once the
Google Drive service account is set up.

USAGE:
    # 1. Preview first — writes nothing, just shows counts per SUK/type:
    python migration/migrate_sheets_to_postgres.py --dry-run

    # 2. When the counts look right, actually migrate:
    python migration/migrate_sheets_to_postgres.py

Safe to re-run: for each SUK, existing rows for that SUK are deleted and
re-inserted fresh, so running it twice never creates duplicates.

Run this from the repo root (bsuk/), with DATABASE_URL and all the
per-SUK *_GAS_URL / *_API_KEY env vars set — the same env vars your
Render services already use today.
"""
import sys
import asyncio
import argparse
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from sqlalchemy import delete
from backend.shared.gas_client import gas_post, SUK_CONFIG
from backend.shared.db import get_session, init_db, db_configured
from backend.shared.db_models import Booking, EventBooking

# sheetName as used by gas_post, mapped to (target table, event_type or None)
SHEETS_TO_MIGRATE = [
    ("Bookings", "booking", None),
    ("Satsang",  "event",   "satsang"),
    ("Bhadra",   "event",   "bhadra"),
    ("Matri",    "event",   "matri"),
    ("Savan",    "event",   "savan"),
]


def normalize_date(val: str) -> str:
    """Sheets sometimes returns dates as a full JS-style date string instead
    of plain YYYY-MM-DD (the same '1899' family of bugs we fixed elsewhere).
    Keep just the date portion if that happens."""
    if not val:
        return ""
    val = str(val).strip()
    if len(val) >= 10 and val[4] == "-" and val[7] == "-":
        return val[:10]
    return val


async def fetch_rows(suk_key: str, sheet_name: str) -> list[dict]:
    try:
        result = await gas_post({"action": "getAll", "sheetName": sheet_name}, suk_key)
    except Exception as e:
        print(f"    ⚠️  {suk_key} / {sheet_name}: fetch failed — {e}")
        return []
    if result.get("success") and isinstance(result.get("data"), list):
        return result["data"]
    if isinstance(result, list):
        return result
    print(f"    ⚠️  {suk_key} / {sheet_name}: unexpected response shape, skipping")
    return []


async def migrate(dry_run: bool):
    if not dry_run and not db_configured():
        print("❌ DATABASE_URL is not set. Set it before running for real (--dry-run works without it... "
              "actually no, it still needs GAS creds). Set DATABASE_URL and try again.")
        return

    if not dry_run:
        await init_db()

    grand_total = 0

    for suk_key, cfg in SUK_CONFIG.items():
        if not cfg.get("url") or not cfg.get("key"):
            print(f"⏭  {suk_key}: no GAS URL/key configured, skipping")
            continue

        print(f"\n📍 {suk_key}")
        suk_total = 0

        for sheet_name, table, event_type in SHEETS_TO_MIGRATE:
            rows = await fetch_rows(suk_key, sheet_name)
            print(f"    {sheet_name:10s} → {len(rows)} row(s)" + (" (dry run, not writing)" if dry_run else ""))
            suk_total += len(rows)

            if dry_run or not rows:
                continue

            async with get_session() as session:
                if table == "booking":
                    await session.execute(delete(Booking).where(Booking.suk_key == suk_key))
                    for r in rows:
                        session.add(Booking(
                            suk_key=suk_key,
                            name=r.get("name", ""),
                            mobile=str(r.get("mobile", "")),
                            place=r.get("place", ""),
                            maps_link=r.get("mapsLink", ""),
                            date=normalize_date(r.get("date", "")),
                            time=r.get("time", ""),
                            day=r.get("day", ""),
                        ))
                else:
                    await session.execute(delete(EventBooking).where(
                        EventBooking.suk_key == suk_key, EventBooking.event_type == event_type
                    ))
                    for r in rows:
                        session.add(EventBooking(
                            suk_key=suk_key,
                            event_type=event_type,
                            name=r.get("name", ""),
                            mobile=str(r.get("mobile", "")),
                            venue=r.get("venue", ""),
                            maps_link=r.get("mapsLink", ""),
                            date=normalize_date(r.get("date", "")),
                            time=r.get("time", ""),
                            hosted_by=r.get("hostedBy", ""),
                            occasion=r.get("occasion", ""),
                        ))

        print(f"    ── {suk_key} total: {suk_total} row(s)")
        grand_total += suk_total

    print(f"\n{'Would migrate' if dry_run else 'Migrated'} {grand_total} row(s) total across all SUKs.")
    if dry_run:
        print("This was a DRY RUN — nothing was written. Re-run without --dry-run to actually migrate.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview counts without writing anything")
    args = parser.parse_args()
    asyncio.run(migrate(dry_run=args.dry_run))
