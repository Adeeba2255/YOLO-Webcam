
import base64
from contextlib import asynccontextmanager
from threading import Lock

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO


model = None
model_lock = Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    model = YOLO("yolo11n.pt")
    yield


app = FastAPI(
    title="YOLO Webcam API",
    description="Real-time object detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "YOLO Webcam API is running"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "yolo11n"}


@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = 0.35,
):
    if not 0.05 <= confidence <= 0.95:
        raise HTTPException(
            status_code=400,
            detail="Confidence must be between 0.05 and 0.95",
        )

    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG, PNG, or WebP image",
        )

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 5 MB",
        )

    image_array = np.frombuffer(content, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    try:
        with model_lock:
            results = model.predict(
                frame,
                conf=confidence,
                imgsz=416,
                verbose=False,
            )

        result = results[0]
        annotated = result.plot()
        detections = []

        for box in result.boxes:
            class_id = int(box.cls[0].item())
            score = float(box.conf[0].item())
            coords = box.xyxy[0].tolist()

            detections.append({
                "label": result.names[class_id],
                "confidence": round(score, 4),
                "box": [round(float(v), 1) for v in coords],
            })

        success, encoded = cv2.imencode(
            ".jpg",
            annotated,
            [cv2.IMWRITE_JPEG_QUALITY, 80],
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Could not encode detection image",
            )

        image_base64 = base64.b64encode(
            encoded.tobytes()
        ).decode("utf-8")

        return {
            "image": image_base64,
            "count": len(detections),
            "detections": detections,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Object detection failed",
        ) from exc
