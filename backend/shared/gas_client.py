import os, httpx

REQUEST_TIMEOUT = 30

# Per-SUK config — keys and URLs stored in Render env vars, never in code
SUK_CONFIG = {
    "bannerghatta": {
        "url": os.getenv("BANNERGHATTA_GAS_URL", ""),
        "key": os.getenv("BANNERGHATTA_API_KEY", ""),
    },
    "peenya-2nd-stage": {
        "url": os.getenv("PEENYA_GAS_URL", ""),
        "key": os.getenv("PEENYA_API_KEY", ""),
    },
    "banashankari": {
        "url": os.getenv("BANASHANKARI_GAS_URL", ""),
        "key": os.getenv("BANASHANKARI_API_KEY", ""),
    },
    "marathahalli": {
        "url": os.getenv("MARATHAHALLI_GAS_URL", ""),
        "key": os.getenv("MARATHAHALLI_API_KEY", ""),
    },
}


def get_suk_config(suk_key: str) -> dict:
    cfg = SUK_CONFIG.get(suk_key)
    if not cfg or not cfg["url"] or not cfg["key"]:
        raise RuntimeError(f"GAS config missing for SUK: {suk_key}. Check Render env vars.")
    return cfg


async def gas_post(params: dict, suk_key: str) -> dict:
    """
    POST to the correct GAS script for the given SUK.
    Uses the real GAS API key from Render env vars — never from frontend.
    """
    cfg     = get_suk_config(suk_key)
    gas_url = cfg["url"]
    api_key = cfg["key"]

    body = {**params, "apiKey": api_key}

    url_params = {
        "action":    body.get("action", ""),
        "sheetName": body.get("sheetName", "Bookings"),
        "id":        body.get("id", ""),
    }
    if body.get("uploader"):
        url_params["uploader"] = body["uploader"]
    if body.get("action") == "uploadPhoto" and "caption" in body:
        url_params["caption"] = body.get("caption", "")

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
        resp = await client.post(
            gas_url,
            params=url_params,
            json=body,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        try:
            return resp.json()
        except Exception:
            return {"success": False, "message": "GAS returned non-JSON response"}