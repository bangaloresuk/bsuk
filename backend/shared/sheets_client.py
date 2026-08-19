"""
Shared Google Sheets client, authenticated as the same service account
used for Drive. Used only by the daily backup job (backup/run_backup.py)
— nothing in the live app writes through this at request time, so a
slow or failed Sheets call here can never affect the app your users see.
"""
import asyncio
import httpx
from backend.shared.google_auth import get_access_token

SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets"

# Sheets API's default quota is modest (roughly 60 write requests/minute
# per user) — backing up 6 SUKs × 6 tabs each in quick succession can
# exceed that. A short pause between every call, plus a retry-with-backoff
# specifically on 429s, keeps a normal run comfortably under the limit.
_MIN_DELAY_SECONDS = 1.2
_MAX_RETRIES = 4


async def _request_with_backoff(client: httpx.AsyncClient, method: str, url: str, **kwargs) -> httpx.Response:
    await asyncio.sleep(_MIN_DELAY_SECONDS)
    resp = None
    for attempt in range(_MAX_RETRIES):
        resp = await client.request(method, url, **kwargs)
        if resp.status_code != 429:
            resp.raise_for_status()
            return resp
        wait = (2 ** attempt) * 2  # 2s, 4s, 8s, 16s
        print(f"[sheets] Rate limited, retrying in {wait}s... (attempt {attempt + 1}/{_MAX_RETRIES})")
        await asyncio.sleep(wait)
    resp.raise_for_status()  # retries exhausted — surface the last error normally
    return resp


async def write_sheet_tab(spreadsheet_id: str, sheet_name: str, header: list[str], rows: list[list]) -> None:
    """
    Overwrites a tab's contents with a fresh header + rows.
    Clears the tab first so removed/edited records don't leave stale rows
    behind — this is a snapshot, not an append.

    SAFETY GUARD: if the tab currently has real data but the new `rows`
    came back empty, this is far more likely a bug upstream (wrong
    DATABASE_URL, a broken query, a bad secret) than a genuine "everything
    was deleted" situation — so it refuses to wipe the tab and raises
    instead, leaving the existing backup untouched.
    """
    token = await get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=60) as client:
        await _ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)

        if not rows:
            existing_row_count = await _count_existing_rows(client, spreadsheet_id, sheet_name, headers)
            if existing_row_count > 1:  # more than just a header row
                raise RuntimeError(
                    f"Refusing to wipe '{sheet_name}' — it currently has "
                    f"{existing_row_count - 1} data row(s), but the new fetch "
                    f"returned 0. This usually means something upstream (a bad "
                    f"DATABASE_URL, a broken query) is wrong, not that the data "
                    f"was actually deleted. Left the existing sheet untouched."
                )

        await _request_with_backoff(
            client, "POST", f"{SHEETS_BASE_URL}/{spreadsheet_id}/values/{sheet_name}:clear",
            headers=headers,
        )

        values = [header] + rows
        await _request_with_backoff(
            client, "PUT", f"{SHEETS_BASE_URL}/{spreadsheet_id}/values/{sheet_name}!A1",
            headers=headers,
            params={"valueInputOption": "RAW"},
            json={"values": values},
        )


async def _count_existing_rows(client: httpx.AsyncClient, spreadsheet_id: str, sheet_name: str, headers: dict) -> int:
    get_resp = await _request_with_backoff(
        client, "GET", f"{SHEETS_BASE_URL}/{spreadsheet_id}/values/{sheet_name}",
        headers=headers,
    )
    return len(get_resp.json().get("values", []))


async def _ensure_sheet_exists(client: httpx.AsyncClient, spreadsheet_id: str, sheet_name: str, headers: dict) -> None:
    get_resp = await _request_with_backoff(
        client, "GET", f"{SHEETS_BASE_URL}/{spreadsheet_id}", headers=headers,
    )
    existing_titles = {s["properties"]["title"] for s in get_resp.json().get("sheets", [])}
    if sheet_name in existing_titles:
        return

    await _request_with_backoff(
        client, "POST", f"{SHEETS_BASE_URL}/{spreadsheet_id}:batchUpdate",
        headers=headers,
        json={"requests": [{"addSheet": {"properties": {"title": sheet_name}}}]},
    )