from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64
import numpy as np
import cv2

from app.models.detector import detector

router = APIRouter(prefix="/api/detect", tags=["Live Detection"])


@router.websocket("/live")
async def live_detection(websocket: WebSocket):
    # Step 1: Connection accept karna
    await websocket.accept()
    print("Live camera client connect ho gaya.")

    try:
        while True:
            # Step 2: Frontend se ek frame receive karna
            # Frontend base64-encoded image bhejega (jaise: "data:image/jpeg;base64,....")
            data = await websocket.receive_text()

            # Agar data mein prefix hai (jaise "data:image/jpeg;base64,") to usko hata dein
            if "," in data:
                data = data.split(",")[1]

            # Step 3: base64 string ko wapis image (numpy array) mein convert karna
            try:
                img_bytes = base64.b64decode(data)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            except Exception:
                await websocket.send_json({"error": "Frame decode nahi ho saka."})
                continue

            if frame is None:
                await websocket.send_json({"error": "Invalid frame data mila."})
                continue

            # Step 4: Detection chalana (usi function se jo image/video mein use kiya tha)
            detections, annotated_frame = detector.detect_frame(frame, confidence=0.3)
            fire_detected = any(d["class_name"] == "fire" for d in detections)

            # Step 5: Annotated frame ko wapis base64 mein convert karna (bhejne ke liye)
            _, buffer = cv2.imencode(".jpg", annotated_frame)
            annotated_base64 = base64.b64encode(buffer).decode("utf-8")

            # Step 6: Result wapis frontend ko bhejna
            await websocket.send_json({
                "fire_detected": fire_detected,
                "detections": detections,
                "annotated_frame": f"data:image/jpeg;base64,{annotated_base64}"
            })

    except WebSocketDisconnect:
        print("Live camera client disconnect ho gaya.")