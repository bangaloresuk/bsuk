from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Any
import re

class ApiResponse(BaseModel):
    success: bool
    message: str = ""
    data: Any = None
    id: str | None = None

def ok(data=None, message="", id=None) -> dict:
    return ApiResponse(success=True, data=data, message=message, id=id).model_dump()

def err(message: str) -> dict:
    return ApiResponse(success=False, message=message).model_dump()

class BookingCreate(BaseModel):
    name: str; mobile: str; place: str; maps_link: str = ""
    date: str; time: str; suk_key: str
    @field_validator("mobile")
    @classmethod
    def check_mobile(cls, v):
        v = v.strip()
        if not re.match(r"^\d{10}$", v): raise ValueError("Mobile must be 10 digits")
        return v
    @field_validator("time")
    @classmethod
    def check_time(cls, v):
        if v not in ("Morning", "Evening"): raise ValueError("time must be Morning or Evening")
        return v

class SatsangCreate(BaseModel):
    name: str; mobile: str; venue: str; date: str; time: str
    hosted_by: str = ""; maps_link: str = ""; occasion: str = ""; suk_key: str
    @field_validator("mobile")
    @classmethod
    def check_mobile(cls, v):
        v = v.strip()
        if not re.match(r"^\d{10}$", v): raise ValueError("Mobile must be 10 digits")
        return v

class PhotoUpload(BaseModel):
    base64: str; filename: str; caption: str = ""; uploader: str = "Anonymous"; suk_key: str

class OtpSend(BaseModel):
    email: str; suk_key: str

class OtpVerify(BaseModel):
    email: str; otp: str; suk_key: str
