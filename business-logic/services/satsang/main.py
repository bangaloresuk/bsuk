import sys, os
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as date_type
from sqlalchemy import select, delete as sa_delete

from backend.shared.db import get_session, init_db, db_configured
from backend.shared.db_models import EventBooking
from backend.shared.auth import validate_suk_key
from backend.shared.models import SatsangCreate, ok, err
from backend.shared.email_client import send_booking_notification

app = FastAPI(title="Satsang Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

EVENT_TYPE = "satsang"
EVENT_LABEL = "Satsang"
DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def get_day(d):
    try: y,m,dy=d.split("-"); return DAYS[date_type(int(y),int(m),int(dy)).weekday()]
    except: return ""

def event_to_dict(e: EventBooking) -> dict:
    return {
        "id": str(e.id), "date": e.date, "time": e.time,
        "name": e.name, "mobile": e.mobile, "venue": e.venue,
        "mapsLink": e.maps_link, "hostedBy": e.hosted_by, "occasion": e.occasion,
        "bookedAt": e.created_at.strftime("%d/%m/%Y, %I:%M:%S %p") if e.created_at else "",
    }

@app.on_event("startup")
async def on_startup():
    if db_configured():
        await init_db()

@app.get("/health")
async def health(): return {"status":"ok","service":"satsang"}

@app.get("/satsang")
async def get_all(suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                select(EventBooking).where(
                    EventBooking.suk_key == suk_key, EventBooking.event_type == EVENT_TYPE
                ).order_by(EventBooking.id)
            )
            rows = result.scalars().all()
        return {"success": True, "data": [event_to_dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/satsang")
async def create(payload: SatsangCreate):
    validate_suk_key(payload.suk_key)
    if payload.date < str(date_type.today()):
        return err("Please select today or a future date.")
    try:
        # NOTE: unlike Bhadra/Matri/Savan, Satsang is intentionally NOT
        # deduped by date+time — multiple hosts can hold satsangs at
        # different homes on the same evening. Matches the old Apps
        # Script's behaviour exactly (Satsang was exempt from the check).
        async with get_session() as session:
            event = EventBooking(
                suk_key=payload.suk_key, event_type=EVENT_TYPE,
                name=payload.name.strip(), mobile=payload.mobile,
                venue=payload.venue.strip(), maps_link=payload.maps_link.strip(),
                date=payload.date, time=payload.time.strip(),
                hosted_by=payload.hosted_by.strip() or payload.suk_key,
                occasion=payload.occasion.strip(),
            )
            session.add(event)
            await session.flush()
            new_id = event.id

        try:
            venue_line = f'<a href="{payload.maps_link}">{payload.maps_link}</a>' if payload.maps_link else payload.venue
            await send_booking_notification(
                payload.suk_key,
                subject=f"Jayguru — New {EVENT_LABEL}: {payload.name} — {payload.date} at {payload.time} [{new_id}]",
                title=f"New {EVENT_LABEL}",
                fields=[
                    ("Event ID", new_id), ("Host", payload.name), ("Mobile", payload.mobile),
                    ("Date", payload.date), ("Time", payload.time), ("Venue", venue_line),
                    ("Hosted By", payload.hosted_by or payload.suk_key),
                    ("Occasion", payload.occasion),
                ],
            )
        except Exception:
            pass

        return {"success": True, "id": str(new_id), "message": f"{EVENT_LABEL} booked! ID: {new_id}"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.delete("/satsang/{satsang_id}")
async def cancel(satsang_id: str, suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                select(EventBooking).where(
                    EventBooking.id == int(satsang_id),
                    EventBooking.suk_key == suk_key,
                    EventBooking.event_type == EVENT_TYPE,
                )
            )
            event = result.scalars().first()
            if event is None:
                return err("Booking ID not found.")
            snapshot = (event.name, event.mobile, event.venue, event.maps_link, event.time, event.date)
            await session.execute(
                sa_delete(EventBooking).where(
                    EventBooking.id == int(satsang_id),
                    EventBooking.suk_key == suk_key,
                    EventBooking.event_type == EVENT_TYPE,
                )
            )

        name, mobile, venue, maps_link, time, date = snapshot
        try:
            venue_line = f'<a href="{maps_link}">{maps_link}</a>' if maps_link else venue
            await send_booking_notification(
                suk_key,
                subject=f"Jayguru — {EVENT_LABEL} Cancelled: {name} — {date} [{satsang_id}]",
                title=f"{EVENT_LABEL} Cancelled",
                fields=[
                    ("Event ID", satsang_id), ("Host", name), ("Mobile", mobile),
                    ("Date", date), ("Time", time), ("Venue", venue_line),
                ],
                cancelled=True,
            )
        except Exception:
            pass

        return ok("Cancelled successfully.")
    except ValueError:
        return err("Invalid booking ID.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.patch("/satsang/{satsang_id}/venue")
async def update_venue(satsang_id: str, payload: dict, suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                select(EventBooking).where(
                    EventBooking.id == int(satsang_id),
                    EventBooking.suk_key == suk_key,
                    EventBooking.event_type == EVENT_TYPE,
                )
            )
            event = result.scalars().first()
            if event is None:
                return err("Booking ID not found.")
            event.venue = payload.get("venue", "")
            event.maps_link = payload.get("mapsLink", "")
        return ok("Venue updated.")
    except ValueError:
        return err("Invalid booking ID.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))