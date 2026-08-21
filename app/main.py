from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.security import limiter, get_security_headers
from app.routers import image_routes, video_routes, live_routes# FastAPI app banayi
app = FastAPI(
    title="Fire Detection API",
    description="AI-powered fire detection backend",
    version="1.0.0"
)

# Rate limiter app se jodna
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware — abhi ke liye sab origins allow kar rahe hain (development mode)
# Jab frontend ready ho jaye to isko specific URL tak limit kar dena (security ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers har response mein add karne ke liye
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    headers = get_security_headers()
    for key, value in headers.items():
        response.headers[key] = value
    return response

# Image detection router jodna
app.include_router(image_routes.router)
app.include_router(video_routes.router)
app.include_router(live_routes.router)

# Simple health-check route
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Fire Detection API chal rahi hai! 🔥",
    }
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)