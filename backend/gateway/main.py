import os, sys, logging, importlib.util, pathlib

ROOT = pathlib.Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))

# Python can't import from "business-logic" (hyphen invalid) — we load with importlib
def load_service(service_name):
    path = ROOT / "business-logic" / "services" / service_name / "main.py"
    spec = importlib.util.spec_from_file_location(f"svc_{service_name.replace('-','_')}", path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.app

logging.basicConfig(level=logging.INFO)

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173").split(",")
    if o.strip()
]

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BSUK API Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET","POST","DELETE","PATCH","OPTIONS"],
    allow_headers=["*"],
)

app.mount("/booking",      load_service("booking"))
app.mount("/satsang",      load_service("satsang"))
app.mount("/gallery",      load_service("gallery"))
app.mount("/auth",         load_service("auth"))
app.mount("/messages",     load_service("messages"))
app.mount("/prayer-times", load_service("prayer-times"))

@app.get("/health")
async def health():
    return {"status": "ok", "service": "BSUK API Gateway"}

@app.get("/")
async def root():
    return {"app": "BSUK Backend", "docs": "/docs", "health": "/health"}
