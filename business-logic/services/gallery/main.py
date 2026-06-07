import sys, os, base64
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.shared.gas_client import gas_post
from backend.shared.auth import validate_suk_key
from backend.shared.models import PhotoUpload, err

app = FastAPI(title="Gallery Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health(): return {"status":"ok","service":"gallery"}

@app.get("/photos")
async def get_all(suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"getPhotos","sheetName":"Photos"}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.post("/photos")
async def upload(payload: PhotoUpload):
    validate_suk_key(payload.suk_key)
    if not payload.base64: return err("No photo data provided.")
    if len(payload.base64.encode()) > 4*1024*1024: return err("Photo too large. Please choose under 3 MB.")
    try: base64.b64decode(payload.base64, validate=True)
    except: return err("Invalid photo data.")
    try:
        return await gas_post({
            "action":"uploadPhoto","base64":payload.base64,"filename":payload.filename,
            "caption":payload.caption.strip(),"uploader":payload.uploader.strip() or "Anonymous",
        }, payload.suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.delete("/photos/{photo_id}")
async def delete(photo_id: str, suk_key: str):
    validate_suk_key(suk_key)
    try: return await gas_post({"action":"deletePhoto","photoId":photo_id}, suk_key)
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))
