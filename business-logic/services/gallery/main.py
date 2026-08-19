import sys, os, base64
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, delete as sa_delete

from backend.shared.db import get_session, init_db, db_configured
from backend.shared.db_models import Photo
from backend.shared.drive_client import upload_photo, delete_photo, drive_configured
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
        "date": p.created_at.strftime("%d/%m/%Y, %I:%M %p") if p.created_at else "",
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
        file_bytes = base64.b64decode(payload.base64, validate=True)
    except Exception:
        return err("Invalid photo data.")

    if not drive_configured():
        raise HTTPException(status_code=502, detail="Drive isn't configured on the server yet.")

    try:
        # Actual image bytes go to Drive — this is the only remaining
        # piece that talks to Google at all for the gallery.
        drive_result = await upload_photo(payload.suk_key, file_bytes, payload.filename)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Drive upload failed: {e}")

    try:
        async with get_session() as session:
            photo = Photo(
                suk_key=payload.suk_key,
                drive_file_id=drive_result["file_id"],
                caption=payload.caption.strip(),
                uploader=payload.uploader.strip() or "Anonymous",
            )
            session.add(photo)
            await session.flush()
            new_id = photo.id
        return {"success": True, "photoId": str(new_id), "url": drive_result["url"], "message": "Photo uploaded!"}
    except Exception as e:
        # Metadata write failed after the Drive upload already succeeded —
        # don't leave an orphaned file with nothing pointing to it.
        try:
            await delete_photo(drive_result["file_id"])
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