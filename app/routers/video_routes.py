from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import uuid
import subprocess
import cv2
import imageio_ffmpeg

from app import config
from app.utils.validators import validate_file_extension, validate_file_size
from app.models.detector import detector
from app.security import verify_api_key

router = APIRouter(prefix="/api/detect", tags=["Video Detection"])

UPLOAD_DIR = "temp_uploads"
RESULT_DIR = "temp_results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()


@router.post("/video")
async def detect_video(
    file: UploadFile = File(...),
    authorized: bool = Depends(verify_api_key)
):
    validate_file_extension(file.filename, config.ALLOWED_VIDEO_TYPES)
    await validate_file_size(file)

    unique_id = str(uuid.uuid4())
    file_extension = file.filename.rsplit(".", 1)[1].lower()
    temp_path = os.path.join(UPLOAD_DIR, f"{unique_id}.{file_extension}")

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Pehle ek "raw" .avi file banayenge (XVID codec — hamesha available hota hai)
    raw_avi_path = os.path.join(RESULT_DIR, f"raw_{unique_id}.avi")
    final_mp4_path = os.path.join(RESULT_DIR, f"result_{unique_id}.mp4")

    try:
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Ye video file kholi nahi ja saki (corrupt ho sakti hai).")

        fps = cap.get(cv2.CAP_PROP_FPS) or 20
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        fourcc = cv2.VideoWriter_fourcc(*"XVID")
        out = cv2.VideoWriter(raw_avi_path, fourcc, fps, (width, height))

        fire_detected_overall = False
        frame_count = 0
        max_frames = 900

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            if frame_count > max_frames:
                break

            detections, annotated_frame = detector.detect_frame(frame, confidence=0.3)
            if any(d["class_name"] == "fire" for d in detections):
                fire_detected_overall = True

            out.write(annotated_frame)

        cap.release()
        out.release()

        # Ab .avi ko browser-friendly .mp4 (H.264) mein convert karna ffmpeg se
        result = subprocess.run(
            [FFMPEG_PATH, "-y", "-i", raw_avi_path, "-vcodec", "libx264", "-pix_fmt", "yuv420p", final_mp4_path],
            capture_output=True, text=True
        )

        if not os.path.exists(final_mp4_path):
            raise HTTPException(status_code=500, detail=f"Video convert nahi ho saki: {result.stderr[-300:]}")

        return {
            "success": True,
            "fire_detected": fire_detected_overall,
            "frames_processed": frame_count,
            "result_video_url": f"/api/detect/result-video/result_{unique_id}.mp4"
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(raw_avi_path):
            os.remove(raw_avi_path)  # raw .avi ab zaroorat nahi, sirf final .mp4 rakhni hai


@router.get("/result-video/{filename}")
async def get_result_video(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = os.path.join(RESULT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result video nahi mili")
    return FileResponse(file_path, media_type="video/mp4")