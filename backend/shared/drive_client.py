"""
Shared Google Drive client, authenticated as a service account (not a
human login). Replaces the old Apps Script `uploadPhoto` / `deletePhoto`
actions — the gallery service now talks to Drive directly.

Credential comes from GOOGLE_SERVICE_ACCOUNT_JSON_B64 (the whole service
account .json key file, base64-encoded into one line) — set once in
Render, shared by all 6 SUKs. Each SUK still uploads into its OWN Drive
folder though: that folder id comes from a per-SUK env var
(e.g. BANNERGHATTA_PHOTO_FOLDER_ID), mirroring how gas_client.py already
does per-SUK lookups for GAS_URL/API_KEY.
"""
import os
import time
import json
import httpx
from backend.shared.google_auth import get_access_token, google_configured

DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files"
DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"

# Per-SUK photo folder id — same naming convention as gas_client.py's
# per-SUK env vars.
PHOTO_FOLDER_ENV = {
    "bannerghatta": "BANNERGHATTA_PHOTO_FOLDER_ID",
    "banashankari": "BANASHANKARI_PHOTO_FOLDER_ID",
    "electronic-city": "ELECTRONIC_CITY_PHOTO_FOLDER_ID",
    "garvebhavi-palya": "GARVEBHAVI_PALYA_PHOTO_FOLDER_ID",
    "marathahalli": "MARATHAHALLI_PHOTO_FOLDER_ID",
    "peenya-2nd-stage": "PEENYA_PHOTO_FOLDER_ID",
}

MIME_TYPES = {
    "png": "image/png", "gif": "image/gif",
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
}


def get_folder_id(suk_key: str) -> str:
    env_name = PHOTO_FOLDER_ENV.get(suk_key)
    if not env_name:
        raise RuntimeError(f"No photo folder configured for SUK: {suk_key}")
    folder_id = os.getenv(env_name, "")
    if not folder_id:
        raise RuntimeError(f"{env_name} is not set — check Render env vars.")
    return folder_id


def guess_mime_type(filename: str) -> str:
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
    return MIME_TYPES.get(ext, "image/jpeg")


# ── Credential handling now lives in google_auth.py (shared with
# sheets_client.py) — drive_configured() kept here as an alias so
# gallery/main.py doesn't need to change its import.
def drive_configured() -> bool:
    return google_configured()


# ── Public API used by gallery/main.py ──────────────────────────

async def upload_photo(suk_key: str, file_bytes: bytes, filename: str) -> dict:
    """Uploads a photo into this SUK's Drive folder, makes it link-viewable
    (matching the old Apps Script behaviour), and returns {file_id, url}."""
    folder_id = get_folder_id(suk_key)
    token = await get_access_token()
    mime_type = guess_mime_type(filename)
    drive_filename = f"BSUK_{int(time.time() * 1000)}_{filename}"

    metadata = {"name": drive_filename, "parents": [folder_id]}
    boundary = "bsuk_upload_boundary"
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{json.dumps(metadata)}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: {mime_type}\r\n\r\n"
    ).encode() + file_bytes + f"\r\n--{boundary}--".encode()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": f"multipart/related; boundary={boundary}",
            },
            content=body,
        )
        resp.raise_for_status()
        file_id = resp.json()["id"]

        # Make it viewable by anyone with the link — same as the old
        # Apps Script's setSharing(ANYONE_WITH_LINK, VIEW).
        perm_resp = await client.post(
            f"{DRIVE_FILES_URL}/{file_id}/permissions",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "reader", "type": "anyone"},
        )
        perm_resp.raise_for_status()

    url = f"https://lh3.googleusercontent.com/d/{file_id}"
    return {"file_id": file_id, "url": url}


async def delete_photo(file_id: str) -> None:
    """Soft-deletes (trashes) a Drive file — matches the old Apps Script's
    setTrashed(true), so accidental deletes are still recoverable from
    Drive's trash for a while, not gone instantly."""
    token = await get_access_token()
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.patch(
            f"{DRIVE_FILES_URL}/{file_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"trashed": True},
        )
        # A 404 here just means the file's already gone — not a real error,
        # matches the old code's "file may already be gone" tolerance.
        if resp.status_code not in (200, 404):
            resp.raise_for_status()