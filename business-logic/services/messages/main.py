import sys, os
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.shared.auth import validate_suk_key
from backend.shared.models import ok

app = FastAPI(title="Messages Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health(): return {"status":"ok","service":"messages"}

@app.post("/messages/satsang")
async def satsang_msg(payload: dict, suk_key: str):
    validate_suk_key(suk_key)
    lines = ["🙏 *Hearty Jayguru* 🙏","","Respected Dada / Maa,",
        "","By the divine grace of *Param Premamay Sree Sree Thakur Anukulchandra*,",
        "we are humbly arranging a *Holy Satsang* at our residence.","",
        "━━━━━━━━━━━━━━━━━━━━","📅 *Date & Time*"]
    if payload.get("date"):
        t = f"  |  {payload['time']} onwards" if payload.get("time") else ""
        lines.append(f"      {payload['date']}{t}")
    lines += ["","📍 *Venue*"]
    if payload.get("venue"): lines.append(f"      {payload['venue']}")
    if payload.get("maps_link"): lines.append(f"      📌 {payload['maps_link']}")
    lines += ["━━━━━━━━━━━━━━━━━━━━","",
        "We most cordially request your divine presence along with your *family and friends*. 🌸",""]
    if payload.get("hosted_by"): lines += ["*With love & Jayguru,*", payload["hosted_by"],""]
    lines.append(f"🙏 *{payload.get('suk_name','Satsang Upayojana Kendra')}* 🙏")
    return ok(data={"message": "\n".join(lines)})

@app.post("/messages/custom")
async def custom_msg(payload: dict, suk_key: str):
    validate_suk_key(suk_key)
    lines = ["🙏 *Hearty Jayguru* 🙏","", payload.get("body","").strip(),"","━━━━━━━━━━━━━━━━━━━━"]
    if payload.get("author"): lines.append(f"*{payload['author'].strip()}*")
    lines.append(f"🙏 *{payload.get('suk_name','Satsang Upayojana Kendra')}* 🙏")
    return ok(data={"message": "\n".join(lines)})
