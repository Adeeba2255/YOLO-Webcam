
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Detection = {
  label: string;
  confidence: number;
  box: number[];
};

type DetectionResult = {
  image: string;
  count: number;
  detections: Detection[];
};

const API_URL = "http://localhost:8000";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [confidence, setConfidence] = useState(35);
  const [source, setSource] = useState<"camera" | "upload">("camera");
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => {
        if (!r.ok) throw new Error("API unavailable");
        return r.json();
      })
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    busyRef.current = false;
    setLoading(false);
  }, []);

  const detectBlob = useCallback(async (blob: Blob) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", blob, "capture.jpg");

      const response = await fetch(
        `${API_URL}/detect?confidence=${confidence / 100}`,
        { method: "POST", body: form }
      );

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || "Detection failed. Check the backend.");
      }

      const data: DetectionResult = await response.json();
      setResult(data);
      setApiOnline(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [confidence]);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || busyRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (blob) await detectBlob(blob);
    }, "image/jpeg", 0.85);
  }, [detectBlob]);


const startCamera = async () => {
  console.log("Start Camera button clicked");

  setError("");
  setResult(null);
  setSource("camera");

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera API is unavailable. Open the site using http://localhost:3000."
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    streamRef.current = stream;

    if (!videoRef.current) {
      throw new Error("Video element was not found.");
    }

    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    setCameraOn(true);
    timerRef.current = setInterval(() => {
      void captureFrame();
    }, 800);

    console.log("Camera started successfully");
  } catch (e) {
    console.error("Camera error:", e);

    setError(
      e instanceof Error
        ? `${e.name}: ${e.message}`
        : "Camera access failed. Check your browser permissions."
    );
  }
};

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      return;
    }

    stopCamera();
    setSource("upload");
    setResult(null);
    await detectBlob(file);
  };

  const objectCounts = (detections: Detection[]) =>
    detections.reduce<Record<string, number>>((counts, item) => {
      counts[item.label] = (counts[item.label] || 0) + 1;
      return counts;
    }, {});

  const counts = objectCounts(result?.detections ?? []);

  return (
    <main className="min-h-screen bg-[#090d18] text-slate-100">
      <header className="border-b border-white/10 bg-[#0d1322]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-2xl">◉</div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">VISION<span className="text-cyan-400">AI</span></h1>
              <p className="text-xs text-slate-400">YOLO Object Detection System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${apiOnline ? "bg-emerald-400" : "bg-rose-400"}`} />
            {apiOnline ? "API Connected" : "API Offline"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400">Computer Vision Dashboard</p>
          <h2 className="text-3xl font-bold md:text-5xl">See the world <span className="text-cyan-400">intelligently.</span></h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Detect and identify objects in your camera feed or uploaded images using YOLO and FastAPI.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="font-semibold">Detection workspace</h3>
                <p className="mt-1 text-xs text-slate-400">Camera feed and annotated results</p>
              </div>
              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                {source === "camera" ? "WEBCAM" : "UPLOADED IMAGE"}
              </span>
            </div>

            <div className="relative flex min-h-70 items-center justify-center bg-[#070b13] p-3 md:min-h-105">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`max-h-120 w-full rounded-xl object-contain ${cameraOn && source === "camera" && !result ? "block" : "hidden"}`}
              />

              {result && (
                <img
                  src={`data:image/jpeg;base64,${result.image}`}
                  alt="YOLO detection result with bounding boxes"
                  className="max-h-120 w-full rounded-xl object-contain"
                />
              )}

              {!cameraOn && !result && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-4xl">⌗</div>
                  <p className="font-medium text-slate-200">Ready to detect</p>
                  <p className="mt-2 text-sm text-slate-500">Start your camera or upload an image</p>
                </div>
              )}

              {cameraOn && !result && (
                <span className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> Camera active
                </span>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
              {!cameraOn ? (
                <button onClick={startCamera} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                  Start camera
                </button>
              ) : (
                <button onClick={stopCamera} className="rounded-xl bg-rose-500/15 px-5 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-500/25">
                  Stop camera
                </button>
              )}

              <label className="cursor-pointer rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/5">
                Upload image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    void uploadImage(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <h3 className="font-semibold">Detection settings</h3>
              <div className="mt-6 flex items-center justify-between">
                <label htmlFor="confidence" className="text-sm text-slate-300">Confidence threshold</label>
                <span className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-sm font-bold text-cyan-300">{confidence}%</span>
              </div>
              <input
                id="confidence"
                type="range"
                min="5"
                max="95"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="mt-5 w-full accent-cyan-400"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>5% · More detections</span><span>95% · More strict</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">A higher threshold shows only predictions with greater confidence. The new value applies to upcoming frames.</p>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
                <p className="text-xs text-slate-400">Objects detected</p>
                <p className="mt-3 text-4xl font-bold">{result?.count ?? "—"}</p>
                <p className="mt-2 text-xs text-slate-500">Latest processed frame</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
                <p className="text-xs text-slate-400">Unique classes</p>
                <p className="mt-3 text-4xl font-bold">{Object.keys(counts).length || "—"}</p>
                <p className="mt-2 text-xs text-slate-500">Different object types</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Detected objects</h3>
                <span className="text-xs text-slate-500">{result?.detections.length ?? 0} items</span>
              </div>

              {loading && <p className="mt-4 text-sm text-cyan-300">Processing image…</p>}
              {error && <p role="alert" className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}

              {!loading && !error && (!result || result.detections.length === 0) && (
                <p className="mt-5 rounded-xl bg-white/3 p-4 text-sm text-slate-500">No detections yet. Start the camera or upload an image.</p>
              )}

              {result && result.detections.length > 0 && (
                <div className="mt-4 space-y-3">
                  {Object.entries(counts).map(([label, count]) => {
                    const best = Math.max(...result.detections.filter((d) => d.label === label).map((d) => d.confidence));
                    return (
                      <div key={label} className="flex items-center justify-between rounded-xl bg-white/3 p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">⌗</span>
                          <div>
                            <p className="text-sm font-medium capitalize">{label}</p>
                            <p className="text-xs text-slate-500">{count} detected</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-emerald-300">{Math.round(best * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-500">
          <span>VISION AI · YOLO + FastAPI + Next.js</span>
          <span>Local development dashboard</span>
        </footer>
      </section>
    </main>
  );
}
