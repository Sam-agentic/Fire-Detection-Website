import os
from dotenv import load_dotenv

# .env file ko load karo
load_dotenv()

# Settings ko Python variables mein convert kar rahe hain
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 10))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE_TYPES = os.getenv("ALLOWED_IMAGE_TYPES", "jpg,jpeg,png").split(",")
ALLOWED_VIDEO_TYPES = os.getenv("ALLOWED_VIDEO_TYPES", "mp4,avi,mov").split(",")

MODEL_PATH = os.getenv("MODEL_PATH", "weights/fire_model.pt")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", 10))

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))
DEBUG_MODE = os.getenv("DEBUG_MODE", "False") == "True"