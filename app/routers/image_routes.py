from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import uuid
import cv2

from app import config
from app.utils.validators import validate_file_extension, validate_file_size, validate_image_content
from app.models.detector import detector
from app.security import verify_api_key

# Ek "router" banate hain — ye chhota FastAPI app jaisa hai, sirf image-related routes ke liye
router = APIRouter(prefix="/api/detect", tags=["Image Detection"])

# Temporary files ke liye ek folder (uploads aur results)
UPLOAD_DIR = "temp_uploads"
RESULT_DIR = "temp_results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)


@router.post("/image")
async def detect_image(
    file: UploadFile = File(...),
    authorized: bool = Depends(verify_api_key)   # pehle API key check hoga
):
    """
    User image upload karta hai, hum detection kar ke result wapis bhejte hain.
    """
    # STEP 1: Extension check (security)
    validate_file_extension(file.filename, config.ALLOWED_IMAGE_TYPES)

    # STEP 2: Size check (security)
    await validate_file_size(file)

    # STEP 3: Ek unique naam generate karte hain (taake do users ki files clash na karein)
    unique_id = str(uuid.uuid4())
    file_extension = file.filename.rsplit(".", 1)[1].lower()
    temp_filename = f"{unique_id}.{file_extension}"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)

    # STEP 4: File ko temporarily save karte hain
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # STEP 5: Content validation (security) - actual file check
        validate_image_content(temp_path)

        # STEP 6: AI Detection chalate hain
        detections, annotated_frame = detector.detect_image(temp_path, confidence=0.3)

        # STEP 7: Result image ko save karte hain
        result_filename = f"result_{unique_id}.jpg"
        result_path = os.path.join(RESULT_DIR, result_filename)
        cv2.imwrite(result_path, annotated_frame)

        # STEP 8: Fire detect hui ya nahi, ye bhi bata dete hain (useful for alerts)
        fire_detected = any(d["class_name"] == "fire" for d in detections)

        return {
            "success": True,
            "fire_detected": fire_detected,
            "detections": detections,
            "result_image_url": f"/api/detect/result/{result_filename}"
        }

    finally:
        # STEP 9: Original uploaded file delete kar dete hain (cleanup - security best practice)
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/result/{filename}")
async def get_result_image(filename: str):
    """
    Result image ko wapis bhejta hai taake frontend usay dikha sake.
    """
    # Security: filename mein koi ".." ya path traversal attempt na ho
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = os.path.join(RESULT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result image nahi mili")

    return FileResponse(file_path, media_type="image/jpeg")