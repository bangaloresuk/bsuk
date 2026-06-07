import sys, os
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as date_type
from backend.shared.gas_client import gas_post
from backend.shared.auth import validate_suk_key
from backend.shared.models import BookingCreate, ok, err

app = FastAPI(title="Booking Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SHEET = "Bookings"
PRAYER_TIMES = {
    1:{"Morning":"06:44","Evening":"18:10"}, 2:{"Morning":"06:40","Evening":"18:23"},
    3:{"Morning":"06:24","Evening":"18:28"}, 4:{"Morning":"06:04","Evening":"18:31"},
    5:{"Morning":"05:52","Evening":"18:37"}, 6:{"Morning":"05:51","Evening":"18:46"},
    7:{"Morning":"05:59","Evening":"18:48"}, 8:{"Morning":"06:05","Evening":"18:38"},
    9:{"Morning":"06:06","Evening":"18:19"},10:{"Morning":"06:09","Evening":"17:58"},
   11:{"Morning":"06:18","Evening":"17:48"},12:{"Morning":"06:34","Evening":"17:54"},
}
DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def get_day(d): 
    try: y,m,dy=d.split("-"); return DAYS[date_type(int(y),int(m),int(dy)).weekday()]
    except: return ""

def get_prayer_time(d, slot):
    try: return PRAYER_TIMES.get(int(d.split("-")[1]),{}).get(slot,"")
    except: return ""

@app.get("/health")
async def health(): return {"status":"ok","service":"booking"}

@app.get("/bookings")
async def get_all(suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"getAll","sheetName":SHEET}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.post("/bookings")
async def create(payload: BookingCreate):
    validate_suk_key(payload.suk_key)
    if payload.date < str(date_type.today()):
        return err("Please select today or a future date.")
    try:
        return await gas_post({
            "action":"add","sheetName":SHEET,"name":payload.name.strip(),
            "mobile":payload.mobile,"place":payload.place.strip(),
            "mapsLink":payload.maps_link.strip(),"day":get_day(payload.date),
            "time":payload.time,"date":payload.date,
            "prayerTime":get_prayer_time(payload.date,payload.time),
        }, payload.suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.delete("/bookings/{booking_id}")
async def cancel(booking_id: str, suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"delete","id":booking_id,"sheetName":SHEET}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.patch("/bookings/{booking_id}/address")
async def update_address(booking_id: str, payload: dict, suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"updateAddress","id":booking_id,"place":payload.get("place",""),"sheetName":SHEET}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))
