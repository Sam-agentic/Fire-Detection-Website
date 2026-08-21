from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request, HTTPException, Header
from app import config

# Rate limiter banate hain - IP address ke hisaab se limit lagayega
limiter = Limiter(key_func=get_remote_address)


def verify_api_key(x_api_key: str = Header(None)):
    """
    Check karta hai ke request ke saath sahi API key aayi hai ya nahi.
    Frontend har request ke header mein ye key bhejega.
    """
    if config.API_SECRET_KEY and x_api_key != config.API_SECRET_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: API key ghalat ya missing hai."
        )
    return True


def get_security_headers():
    """
    Ye extra HTTP headers hain jo browser ko batate hain
    security ke hisaab se kya allow hai aur kya nahi.
    """
    return {
        "X-Content-Type-Options": "nosniff",       # Browser ko file type "guess" karne se rokta hai
        "X-Frame-Options": "DENY",                    # Site ko kisi aur website ke iframe mein embed hone se rokta hai (clickjacking se bachav)
        "X-XSS-Protection": "1; mode=block",           # Purane browsers mein XSS attacks se bachav
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",  # Hamesha HTTPS use karne pe zor deta hai
    }