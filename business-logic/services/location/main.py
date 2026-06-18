import sys, os, httpx
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.shared.auth import validate_suk_key
from backend.shared.models import ok, err

# ============================================================
#  LOCATION SERVICE
#  ─────────────────────────────────────────────────────────
#  Proxies Google Places API (New) + Geocoding API calls.
#  The Google API key lives only in this server's environment
#  (GOOGLE_MAPS_API_KEY on Render) and is never sent to the
#  browser — the frontend only ever talks to these endpoints.
# ============================================================

app = FastAPI(title="Location Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

GOOGLE_MAPS_API_KEY = os.getenv("Maps_API_KEY", "")
REQUEST_TIMEOUT = 10
NOT_CONFIGURED = "Location lookup isn't configured yet. Ask the admin to set Maps_API_KEY on Render."


@app.get("/health")
async def health():
    return {"status": "ok", "service": "location"}


@app.get("/search")
async def search(q: str, suk_key: str):
    """Autocomplete suggestions for the search box, restricted to India."""
    validate_suk_key(suk_key)
    if not GOOGLE_MAPS_API_KEY:
        return err(NOT_CONFIGURED)
    if not q or len(q.strip()) < 3:
        return ok(data=[])

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(
            "https://places.googleapis.com/v1/places:autocomplete",
            json={"input": q.strip(), "includedRegionCodes": ["in"], "languageCode": "en"},
            headers={"Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY},
        )

    if resp.status_code != 200:
        return err("Location search failed. Please try again.")

    data = resp.json()
    suggestions = [
        {
            "placeId": p["placePrediction"]["placeId"],
            "display_name": p["placePrediction"].get("text", {}).get("text", ""),
        }
        for p in data.get("suggestions", [])
        if "placePrediction" in p
    ]
    return ok(data=suggestions)


@app.get("/place/{place_id}")
async def place_details(place_id: str, suk_key: str):
    """Exact coordinates + formatted address for a chosen suggestion."""
    validate_suk_key(suk_key)
    if not GOOGLE_MAPS_API_KEY:
        return err(NOT_CONFIGURED)

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.get(
            f"https://places.googleapis.com/v1/places/{place_id}",
            headers={
                "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": "location,formattedAddress",
            },
        )

    if resp.status_code != 200:
        return err("Couldn't fetch place details. Please try again.")

    data = resp.json()
    loc = data.get("location") or {}
    return ok(data={
        "address": data.get("formattedAddress", ""),
        "lat": loc.get("latitude"),
        "lon": loc.get("longitude"),
    })


@app.get("/reverse")
async def reverse(lat: float, lon: float, suk_key: str):
    """Turn GPS coordinates from the 'My location' button into a readable address."""
    validate_suk_key(suk_key)
    if not GOOGLE_MAPS_API_KEY:
        return err(NOT_CONFIGURED)

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={
                "latlng": f"{lat},{lon}",
                "key": GOOGLE_MAPS_API_KEY,
                "region": "in",
                "language": "en",
            },
        )

    if resp.status_code != 200:
        return err("Couldn't look up that location. Please try again.")

    data = resp.json()
    results = data.get("results") or []
    address = results[0]["formatted_address"] if results else ""
    return ok(data={"address": address})