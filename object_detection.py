
import cv2
from ultralytics import YOLO

# Load the pretrained YOLO model
print("Loading YOLO model...")
model = YOLO("yolo11n.pt")

# Open the laptop webcam
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Error: Cannot open webcam.")
    print("Try changing VideoCapture(0) to VideoCapture(1).")
    raise SystemExit

print("Camera started!")
print("Press Q to quit.")

try:
    while True:
        # Capture a frame from the webcam
        success, frame = camera.read()

        if not success:
            print("Cannot read camera frame.")
            break

        # Detect objects in the current frame
        results = model.predict(
            source=frame,
            conf=0.35,
            imgsz=416,
            verbose=False
        )

        # Draw bounding boxes and labels
        output = results[0].plot()

        # Count detected objects
        count = len(results[0].boxes)

        cv2.putText(
            output,
            f"Objects detected: {count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

        # Display the live detection window
        cv2.imshow("YOLO Object Detection", output)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

finally:
    camera.release()
    cv2.destroyAllWindows()
    print("Camera closed.")

