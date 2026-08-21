from ultralytics import YOLO
import cv2
import numpy as np
from app import config

class FireDetector:
    def __init__(self):
        """
        Model ko sirf ek dafa load karta hai jab server start hota hai.
        Baar baar load karna bohot slow hota, isliye ye 'singleton' pattern use kar rahe hain.
        """
        print("Loading fire detection model...")
        self.model = YOLO(config.MODEL_PATH)
        print("Model loaded successfully!")

    def detect_image(self, image_path: str, confidence: float = 0.4):
        """
        Ek image pe detection chalata hai.
        Return karta hai: detections ki list (class name, confidence, box coordinates)
        """
        results = self.model.predict(
            source=image_path,
            conf=confidence,
            save=False   # hum khud manage karenge save karna
        )

        detections = []
        for result in results:
            for box in result.boxes:
                detections.append({
                    "class_name": result.names[int(box.cls[0])],
                    "confidence": float(box.conf[0]),
                    "box": box.xyxy[0].tolist()   # [x1, y1, x2, y2] coordinates
                })

        # Annotated image (boxes ke sath) bhi generate karte hain
        annotated_frame = results[0].plot()  # ye ek numpy image return karta hai, boxes ke sath

        return detections, annotated_frame

    def detect_frame(self, frame: np.ndarray, confidence: float = 0.4):
        """
        Ek single video frame (ya live camera frame) pe detection chalata hai.
        Video aur live camera dono isi function ko use karenge, frame-by-frame.
        """
        results = self.model.predict(source=frame, conf=confidence, save=False, verbose=False)

        detections = []
        for result in results:
            for box in result.boxes:
                detections.append({
                    "class_name": result.names[int(box.cls[0])],
                    "confidence": float(box.conf[0]),
                    "box": box.xyxy[0].tolist()
                })

        annotated_frame = results[0].plot()
        return detections, annotated_frame


# Ek hi global instance banate hain, taake model baar baar load na ho
detector = FireDetector()