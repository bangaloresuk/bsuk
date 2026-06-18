import sys, os
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as date_type
from backend.shared.gas_client import gas_post
from backend.shared.auth import validate_suk_key
from backend.shared.models import SatsangCreate, err

app = FastAPI(title="Savan Parikrama Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SHEET = "Savan"
DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def get_day(d):
    try: y,m,dy=d.split("-"); return DAYS[date_type(int(y),int(m),int(dy)).weekday()]
    except: return ""

@app.get("/health")
async def health(): return {"status":"ok","service":"savan"}

@app.get("/savan")
async def get_all(suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"getAll","sheetName":SHEET}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.post("/savan")
async def create(payload: SatsangCreate):
    validate_suk_key(payload.suk_key)
    if payload.date < str(date_type.today()):
        return err("Please select today or a future date.")
    try:
        return await gas_post({
            "action":"add","sheetName":SHEET,"name":payload.name.strip(),
            "mobile":payload.mobile,"venue":payload.venue.strip(),"date":payload.date,
            "time":payload.time.strip(),"hostedBy":payload.hosted_by.strip() or payload.suk_key,
            "mapsLink":payload.maps_link.strip(),
            "day":get_day(payload.date),
        }, payload.suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.delete("/savan/{event_id}")
async def cancel(event_id: str, suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"delete","id":event_id,"sheetName":SHEET}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))
