import os
from fastapi import HTTPException, status

def validate_suk_key(suk_key: str) -> str:
    valid = {k.strip() for k in os.getenv("API_KEYS", "").split(",") if k.strip()}
    if suk_key not in valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid SUK API key")
    return suk_key
