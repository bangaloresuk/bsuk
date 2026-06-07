import os, httpx
GAS_SCRIPT_URL = os.getenv("GAS_SCRIPT_URL", "")
REQUEST_TIMEOUT = 30

async def gas_post(params: dict, api_key: str) -> dict:
    if not GAS_SCRIPT_URL:
        raise RuntimeError("GAS_SCRIPT_URL environment variable is not set")
    body = {**params, "apiKey": api_key}
    url_params = {
        "action":    body.get("action", ""),
        "sheetName": body.get("sheetName", "Bookings"),
        "id":        body.get("id", ""),
    }
    if body.get("uploader"): url_params["uploader"] = body["uploader"]
    if body.get("action") == "uploadPhoto" and "caption" in body:
        url_params["caption"] = body.get("caption", "")
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
        resp = await client.post(
            GAS_SCRIPT_URL, params=url_params, json=body,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        try: return resp.json()
        except: return {"success": False, "message": "GAS returned non-JSON response"}
