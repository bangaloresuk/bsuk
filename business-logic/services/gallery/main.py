import sys, os, base64
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, delete as sa_delete

from backend.shared.db import get_session, init_db, db_configured
from backend.shared.db_models import Photo
from backend.shared.drive_client import delete_photo
from backend.shared.gas_client import gas_post
from backend.shared.timeutils import to_ist_str
from backend.shared.auth import validate_suk_key
from backend.shared.models import PhotoUpload, ok, err

app = FastAPI(title="Gallery Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def photo_to_dict(p: Photo) -> dict:
    return {
        "id": str(p.id),
        "fileId": p.drive_file_id,
        "url": f"https://lh3.googleusercontent.com/d/{p.drive_file_id}",
        "caption": p.caption,
        "uploader": p.uploader,
        "date": to_ist_str(p.created_at, "%d/%m/%Y, %I:%M %p"),
    }


@app.on_event("startup")
async def on_startup():
    if db_configured():
        await init_db()


@app.get("/health")
async def health(): return {"status": "ok", "service": "gallery"}


@app.get("/photos")
async def get_all(suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                select(Photo).where(Photo.suk_key == suk_key).order_by(Photo.created_at.desc())
            )
            rows = result.scalars().all()
        return {"success": True, "data": [photo_to_dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/photos")
async def upload(payload: PhotoUpload):
    validate_suk_key(payload.suk_key)
    if not payload.base64:
        return err("No photo data provided.")
    if len(payload.base64.encode()) > 4 * 1024 * 1024:
        return err("Photo too large. Please choose under 3 MB.")
    try:
        base64.b64decode(payload.base64, validate=True)  # early validation only
    except Exception:
        return err("Invalid photo data.")

    try:
        # The actual image bytes go through Apps Script, which uploads as
        # your real bangaloresuk@gmail.com account — that account has real
        # Drive storage quota. A service account never can (Google Drive
        # gives service accounts zero storage of their own on a personal
        # Gmail account, with no workaround short of a paid Workspace
        # plan) — see drive_client.py's delete_photo for where the service
        # account IS still used (deleting an existing file doesn't consume
        # new storage, so that direction works fine).
        # This is the ONLY part of the gallery that still talks to Apps
        # Script — listing, captions, and all other metadata stay on
        # Postgres exactly as before.
        gas_result = await gas_post({
            "action": "uploadPhoto",
            "sheetName": "Photos",
            "base64": payload.base64,
            "filename": payload.filename,
            "caption": payload.caption.strip(),
            "uploader": payload.uploader.strip() or "Anonymous",
        }, payload.suk_key)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Drive upload failed: {e}")

    if not gas_result.get("success"):
        return err(gas_result.get("message", "Upload failed."))

    # Apps Script returns a view URL like https://lh3.googleusercontent.com/d/{fileId}
    # — pull the file id back out of it so we can store it in Postgres.
    view_url = gas_result.get("url", "")
    drive_file_id = view_url.rsplit("/d/", 1)[-1] if "/d/" in view_url else ""
    if not drive_file_id:
        raise HTTPException(status_code=502, detail="Upload succeeded but no file ID was returned.")

    try:
        async with get_session() as session:
            photo = Photo(
                suk_key=payload.suk_key,
                drive_file_id=drive_file_id,
                caption=payload.caption.strip(),
                uploader=payload.uploader.strip() or "Anonymous",
            )
            session.add(photo)
            await session.flush()
            new_id = photo.id
        return {"success": True, "photoId": str(new_id), "url": view_url, "message": "Photo uploaded!"}
    except Exception as e:
        # Metadata write failed after the Drive upload already succeeded —
        # don't leave an orphaned file with nothing pointing to it.
        try:
            await delete_photo(drive_file_id)
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=str(e))


@app.delete("/photos/{photo_id}")
async def delete(photo_id: str, suk_key: str):
    validate_suk_key(suk_key)
    try:
        async with get_session() as session:
            result = await session.execute(
                select(Photo).where(Photo.id == int(photo_id), Photo.suk_key == suk_key)
            )
            photo = result.scalars().first()
            if photo is None:
                return err("Photo ID not found.")
            drive_file_id = photo.drive_file_id
            await session.execute(
                sa_delete(Photo).where(Photo.id == int(photo_id), Photo.suk_key == suk_key)
            )
        try:
            await delete_photo(drive_file_id)
        except Exception:
            # Matches the old code's tolerance: if the Drive file is
            # already gone, that's fine — the metadata row is still removed.
            pass
        return ok("Photo deleted.")
    except ValueError:
        return err("Invalid photo ID.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))