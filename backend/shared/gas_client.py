import os, time, httpx

REQUEST_TIMEOUT = 30
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "30"))

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
    "electronic-city": {
        "url": os.getenv("ELECTRONIC_CITY_GAS_URL", ""),
        "key": os.getenv("ELECTRONIC_CITY_API_KEY", ""),
    },
    "garvebhavi-palya": {
        "url": os.getenv("GARVEBHAVI_PALYA_GAS_URL", ""),
        "key": os.getenv("GARVEBHAVI_PALYA_API_KEY", ""),
    },
}

# Simple in-memory read cache: { (suk_key, sheetName): (timestamp, response) }
_read_cache: dict = {}


def get_suk_config(suk_key: str) -> dict:
    cfg = SUK_CONFIG.get(suk_key)
    if not cfg or not cfg["url"] or not cfg["key"]:
        raise RuntimeError(f"GAS config missing for SUK: {suk_key}. Check Render env vars.")
    return cfg


async def gas_post(params: dict, suk_key: str) -> dict:
    """
    POST to the correct GAS script for the given SUK.
    Uses the real GAS API key from Render env vars — never from frontend.
    Reads (action=getAll) are cached in-memory for CACHE_TTL_SECONDS.
    Any write (add/delete/update/upload) invalidates that sheet's cache entry.
    """
    cfg     = get_suk_config(suk_key)
    gas_url = cfg["url"]
    api_key = cfg["key"]

    action     = params.get("action", "")
    sheet_name = params.get("sheetName", "Bookings")
    cache_key  = (suk_key, sheet_name)

    if action == "getAll":
        cached = _read_cache.get(cache_key)
        if cached and (time.time() - cached[0]) < CACHE_TTL_SECONDS:
            return cached[1]
    else:
        # Any write invalidates the cached read for this sheet
        _read_cache.pop(cache_key, None)

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
            result = resp.json()
        except Exception:
            result = {"success": False, "message": "GAS returned non-JSON response"}

    if action == "getAll" and result.get("success", True):
        _read_cache[cache_key] = (time.time(), result)

    return result