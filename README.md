# YOLO Webcam Object Detection

A real-time object detection project using **YOLO, OpenCV, FastAPI, and Next.js**. This application captures video from a webcam and detects objects in real time through a web interface.

## Features

- Real-time webcam access
- YOLO-based object detection
- Image processing with OpenCV
- FastAPI backend for detection requests
- Next.js frontend with a web interface
- Confidence threshold control
- REST API for sending images and receiving detections

## Tech Stack

**AI & Computer Vision**
- Python
- Ultralytics YOLO
- OpenCV

**Backend**
- FastAPI
- Uvicorn

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

## Project Structure

```text
YOLO-Webcam/
├── backend/
│   └── main.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── package.json
│   └── ...
├── object_detection.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Requirements

- Python 3.10 or compatible version supported by your installed packages
- Node.js and npm
- A webcam
- Internet access for installing dependencies and downloading YOLO weights if they are not already available

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Adeeba2255/YOLO-Webcam.git
cd YOLO-Webcam
```

### 2. Set up the Python environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
python -m pip install -r requirements.txt
```

### 3. Start the backend

```powershell
cd backend
python -m uvicorn main:app --reload
```

The backend should be available at:

- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs

Keep this terminal running.

### 4. Start the frontend

Open a **second terminal** in the project root and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the application in your browser:

http://localhost:3000

## How to Use

1. Start the backend and frontend.
2. Open the web application.
3. Allow camera access in your browser.
4. Start the webcam if the interface requires it.
5. View the detected objects and their confidence scores.

## Troubleshooting

- **Camera not working:** Allow camera permissions in your browser and ensure another application is not using it.
- **Backend connection error:** Confirm the backend is running on port `8000`.
- **Frontend not opening:** Run `npm install` inside the `frontend` directory, then `npm run dev`.
- **YOLO weights missing:** Allow the Ultralytics model to download its required weights, or configure the correct local model path.

## Future Improvements

- Save detection results and screenshots.
- Add support for custom-trained YOLO models.
- Improve detection speed and performance.
- Add object tracking.

## Author

**Adeeba Afkar**

GitHub: [@Adeeba2255](https://github.com/Adeeba2255)

---

*This project was developed for learning and demonstrating real-time computer vision and full-stack AI application development.*
