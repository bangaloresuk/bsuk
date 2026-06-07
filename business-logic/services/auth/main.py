import sys, os
import pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.shared.gas_client import gas_post
from backend.shared.auth import validate_suk_key
from backend.shared.models import OtpSend, OtpVerify, ok, err

app = FastAPI(title="Auth Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health(): return {"status":"ok","service":"auth"}

@app.post("/auth/otp/send")
async def send_otp(payload: OtpSend):
    validate_suk_key(payload.suk_key)
    try:
        result = await gas_post({"action":"sendAdminOtp","email":payload.email}, payload.suk_key)
        return ok(message="OTP sent.") if result.get("success") else err(result.get("message","Failed to send OTP"))
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))

@app.post("/auth/otp/verify")
async def verify_otp(payload: OtpVerify):
    validate_suk_key(payload.suk_key)
    if len(payload.otp.strip()) < 6: return err("Please enter the 6-digit OTP.")
    try:
        result = await gas_post({"action":"verifyAdminOtp","email":payload.email,"otp":payload.otp.strip()}, payload.suk_key)
        return ok(message="Verified.") if result.get("success") else err(result.get("message","Invalid OTP"))
    except Exception as e: raise HTTPException(status_code=502, detail=str(e))
