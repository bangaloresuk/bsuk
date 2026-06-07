import sys, os
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.shared.auth import validate_suk_key
from backend.shared.models import ok, err

app = FastAPI(title="Prayer Times Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

PRAYER_TIMES = {
    1:{"Morning":"06:44","Evening":"18:10"}, 2:{"Morning":"06:40","Evening":"18:23"},
    3:{"Morning":"06:24","Evening":"18:28"}, 4:{"Morning":"06:04","Evening":"18:31"},
    5:{"Morning":"05:52","Evening":"18:37"}, 6:{"Morning":"05:51","Evening":"18:46"},
    7:{"Morning":"05:59","Evening":"18:48"}, 8:{"Morning":"06:05","Evening":"18:38"},
    9:{"Morning":"06:06","Evening":"18:19"},10:{"Morning":"06:09","Evening":"17:58"},
   11:{"Morning":"06:18","Evening":"17:48"},12:{"Morning":"06:34","Evening":"17:54"},
}
MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"]

@app.get("/health")
async def health(): return {"status":"ok","service":"prayer-times"}

@app.get("/prayer-times")
async def get_all(suk_key: str):
    validate_suk_key(suk_key)
    return ok(data={MONTHS[m]: t for m,t in PRAYER_TIMES.items()})

@app.get("/prayer-times/{date}")
async def get_for_date(date: str, suk_key: str):
    validate_suk_key(suk_key)
    try: month = int(date.split("-")[1])
    except: raise HTTPException(status_code=400, detail="Use YYYY-MM-DD format")
    times = PRAYER_TIMES.get(month)
    if not times: return err(f"No times for month {month}")
    return ok(data={"date":date,"month":MONTHS[month],**times})
