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

app = FastAPI(title="Bhadra Parikrama Satsang Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

EVENT_TYPE = "bhadra"
DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def get_day(d):
    try: y,m,dy=d.split("-"); return DAYS[date_type(int(y),int(m),int(dy)).weekday()]
    except: return ""

def event_to_dict(e: EventBooking) -> dict:
    return {
        "id": str(e.id), "date": e.date, "day": e.day, "time": e.time,
        "name": e.name, "mobile": e.mobile, "venue": e.venue,
        "mapsLink": e.maps_link, "hostedBy": e.hosted_by,
        "bookedAt": e.created_at.strftime("%d/%m/%Y, %I:%M:%S %p") if e.created_at else "",
    }

@app.on_event("startup")
async def on_startup():
    if db_configured():
        await init_db()

@app.get("/health")
async def health(): return {"status":"ok","service":"bhadra"}

@app.get("/bhadra")
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

@app.post("/bhadra")
async def create(payload: SatsangCreate):
    validate_suk_key(payload.suk_key)
    if payload.date < str(date_type.today()):
        return err("Please select today or a future date.")
    try:
        async with get_session() as session:
            # Bhadra is single-venue — same date+time slot can't be double-booked,
            # same rule the old Apps Script enforced (DEDUPE_DATE_TIME_SHEETS).
            existing = await session.execute(
                select(EventBooking).where(
                    EventBooking.suk_key == payload.suk_key,
                    EventBooking.event_type == EVENT_TYPE,
                    EventBooking.date == payload.date,
                    EventBooking.time == payload.time.strip(),
                )
            )
            if existing.scalars().first() is not None:
                return err(
                    f"Slot Already Booked! Bhadra Parikrama Satsang on {payload.date} at "
                    f"{payload.time} is already reserved.\nPlease choose a different date or time."
                )

            event = EventBooking(
                suk_key=payload.suk_key, event_type=EVENT_TYPE,
                name=payload.name.strip(), mobile=payload.mobile,
                venue=payload.venue.strip(), maps_link=payload.maps_link.strip(),
                date=payload.date, time=payload.time.strip(),
                hosted_by=payload.hosted_by.strip() or payload.suk_key,
                day=get_day(payload.date),
            )
            session.add(event)
            await session.flush()
            new_id = event.id
        return {"success": True, "id": str(new_id), "message": f"Bhadra Parikrama Satsang booked! ID: {new_id}"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.delete("/bhadra/{event_id}")
async def cancel(event_id: str, suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                sa_delete(EventBooking).where(
                    EventBooking.id == int(event_id),
                    EventBooking.suk_key == suk_key,
                    EventBooking.event_type == EVENT_TYPE,
                )
            )
        if result.rowcount == 0:
            return err("Booking ID not found.")
        return ok("Cancelled successfully.")
    except ValueError:
        return err("Invalid booking ID.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.patch("/bhadra/{event_id}/venue")
async def update_venue(event_id: str, payload: dict, suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                select(EventBooking).where(
                    EventBooking.id == int(event_id),
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