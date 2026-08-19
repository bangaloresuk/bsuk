"""
Shared Google Sheets client, authenticated as the same service account
used for Drive. Used only by the daily backup job (backup/run_backup.py)
— nothing in the live app writes through this at request time, so a
slow or failed Sheets call here can never affect the app your users see.
"""
import httpx
from backend.shared.google_auth import get_access_token

SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets"


async def write_sheet_tab(spreadsheet_id: str, sheet_name: str, header: list[str], rows: list[list]) -> None:
    """
    Overwrites a tab's contents with a fresh header + rows.
    Clears the tab first so removed/edited records don't leave stale rows
    behind — this is a snapshot, not an append.
    """
    token = await get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=60) as client:
        # 1. Make sure the tab exists — create it if this is the first
        #    backup run for a SUK/sheet combination that's never had it.
        await _ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)

        # 2. Clear existing content so stale/deleted rows don't linger.
        clear_resp = await client.post(
            f"{SHEETS_BASE_URL}/{spreadsheet_id}/values/{sheet_name}:clear",
            headers=headers,
        )
        clear_resp.raise_for_status()

        # 3. Write header + rows in one call.
        values = [header] + rows
        update_resp = await client.put(
            f"{SHEETS_BASE_URL}/{spreadsheet_id}/values/{sheet_name}!A1",
            headers=headers,
            params={"valueInputOption": "RAW"},
            json={"values": values},
        )
        update_resp.raise_for_status()


async def _ensure_sheet_exists(client: httpx.AsyncClient, spreadsheet_id: str, sheet_name: str, headers: dict) -> None:
    get_resp = await client.get(f"{SHEETS_BASE_URL}/{spreadsheet_id}", headers=headers)
    get_resp.raise_for_status()
    existing_titles = {s["properties"]["title"] for s in get_resp.json().get("sheets", [])}
    if sheet_name in existing_titles:
        return

    add_resp = await client.post(
        f"{SHEETS_BASE_URL}/{spreadsheet_id}:batchUpdate",
        headers=headers,
        json={"requests": [{"addSheet": {"properties": {"title": sheet_name}}}]},
    )
    add_resp.raise_for_status()