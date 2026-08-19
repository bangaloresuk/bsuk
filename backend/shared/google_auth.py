"""
Shared Google service-account credential loader. One credential, one
identity — used by both drive_client.py (photo uploads) and
sheets_client.py (daily backup). Requesting both scopes together means
a single cached token works for both Drive and Sheets calls.
"""
import os
import json
import base64
import asyncio
from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleAuthRequest

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

_credentials = None
_creds_lock = asyncio.Lock()


def _load_credentials():
    b64 = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64", "")
    if not b64:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set — check Render env vars.")
    try:
        info = json.loads(base64.b64decode(b64))
    except Exception as e:
        raise RuntimeError(f"GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not valid base64-encoded JSON: {e}")
    return service_account.Credentials.from_service_account_info(info, scopes=GOOGLE_SCOPES)


async def get_access_token() -> str:
    """Returns a valid access token, refreshing (in a background thread,
    since google-auth's refresh call is blocking/synchronous) only when
    the cached one is missing or expired."""
    global _credentials
    async with _creds_lock:
        if _credentials is None:
            _credentials = await asyncio.to_thread(_load_credentials)
        if not _credentials.valid:
            await asyncio.to_thread(_credentials.refresh, GoogleAuthRequest())
    return _credentials.token


def google_configured() -> bool:
    return bool(os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64"))