import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { calculateAngle } from "@/lib/utils";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Zap } from "lucide-react";

export default function RehabVision({ isActive, onRepComplete }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastRepStateRef = useRef("up");

  const [reps, setReps] = useState(0);
  const [angle, setAngle] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [feedback, setFeedback] = useState("Position yourself in frame");

  const repsRef = useRef(0);

  // Load MediaPipe PoseLandmarker
  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        poseLandmarkerRef.current = landmarker;
        setModelLoaded(true);
        setFeedback("Model ready — Start your session");
      } catch (e) {
        console.error("MediaPipe load error:", e);
        setFeedback("Pose model unavailable — using simulation mode");
        setModelLoaded(false);
      } finally {
        setLoading(false);
      }
    };
    loadModel();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const drawSkeleton = useCallback(
    (ctx, landmarks, width, height) => {
      // Connection pairs for skeleton
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 23], [12, 24], [23, 24],
        [23, 25], [25, 27], [27, 29], [27, 31],
        [24, 26], [26, 28], [28, 30], [28, 32],
      ];

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(0, 229, 255, 0.7)";
      connections.forEach(([a, b]) => {
        const lmA = landmarks[a];
        const lmB = landmarks[b];
        if ((lmA.visibility ?? 1) > 0.5 && (lmB.visibility ?? 1) > 0.5) {
          ctx.beginPath();
          ctx.moveTo(lmA.x * width, lmA.y * height);
          ctx.lineTo(lmB.x * width, lmB.y * height);
          ctx.stroke();
        }
      });

      // Draw joint circles
      landmarks.forEach((lm, i) => {
        if ((lm.visibility ?? 1) > 0.5) {
          ctx.beginPath();
          const isKnee = i === 25 || i === 26;
          ctx.arc(lm.x * width, lm.y * height, isKnee ? 7 : 5, 0, 2 * Math.PI);
          ctx.fillStyle = isKnee ? "#ff6b6b" : "rgba(0, 229, 255, 0.9)";
          ctx.fill();
        }
      });
    },
    []
  );

  const processFrame = useCallback(() => {
    const webcam = webcamRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarkerRef.current;

    if (!webcam || !canvas || !webcam.video) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcam.video;
    if (video.readyState !== 4) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarker) {
      try {
        const results = landmarker.detectForVideo(video, performance.now());
        if (results.landmarks && results.landmarks.length > 0) {
          const lms = results.landmarks[0];
          drawSkeleton(ctx, lms, canvas.width, canvas.height);

          // Left knee: hip=23, knee=25, ankle=27
          const hip = lms[23];
          const knee = lms[25];
          const ankle = lms[27];

          if (hip && knee && ankle) {
            const kneeAngle = calculateAngle(
              { x: hip.x, y: hip.y },
              { x: knee.x, y: knee.y },
              { x: ankle.x, y: ankle.y }
            );
            setAngle(Math.round(kneeAngle));

            // Rep logic
            if (kneeAngle < 90 && lastRepStateRef.current === "up") {
              lastRepStateRef.current = "down";
              setFeedback("💪 Deep squat — great form!");
            } else if (kneeAngle > 150 && lastRepStateRef.current === "down") {
              lastRepStateRef.current = "up";
              repsRef.current += 1;
              setReps(repsRef.current);
              if (onRepComplete) onRepComplete(repsRef.current);
              setFeedback(`✅ Rep ${repsRef.current} complete!`);
            } else if (kneeAngle >= 90 && kneeAngle <= 150) {
              setFeedback("⬇️ Bend deeper — aim for < 90°");
            }
          }
        }
      } catch (e) {
        // skip frame on error
      }
    } else {
      // Simulation mode
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [drawSkeleton, onRepComplete]);

  useEffect(() => {
    if (isActive && cameraReady) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, cameraReady, processFrame]);

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--accent-cyan)", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "4px" }}>
            VISION ANALYSIS
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
            RehabVision™
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {loading && (
            <span style={{ fontSize: "11px", color: "var(--accent-amber)" }}>
              Loading AI model...
            </span>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "20px",
              background: isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 100, 120, 0.1)",
              border: `1px solid ${isActive ? "rgba(16,185,129,0.4)" : "var(--border-subtle)"}`,
              fontSize: "11px",
              fontWeight: 600,
              color: isActive ? "var(--accent-green)" : "var(--text-muted)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isActive ? "var(--accent-green)" : "var(--text-muted)",
                animation: isActive ? "pulse-glow 1.5s ease-in-out infinite" : "none",
              }}
            />
            {isActive ? "LIVE" : "STANDBY"}
          </div>
        </div>
      </div>

      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#060d1a", border: "1px solid var(--border-subtle)", aspectRatio: "16/9" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored
          onUserMedia={() => setCameraReady(true)}
          onUserMediaError={() => setFeedback("Camera access denied")}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: cameraReady ? 1 : 0 }}
          videoConstraints={{ facingMode: "user" }}
        />
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }} />

        {!cameraReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: "#060d1a" }}>
            <Camera size={40} color="var(--text-muted)" />
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>Requesting camera access…</p>
          </div>
        )}

        {isActive && cameraReady && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.6), transparent)", animation: "scan-line 2.5s linear infinite" }} />
        )}

        {angle !== null && isActive && (
          <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(5, 11, 24, 0.85)", border: "1px solid var(--border-glow)", borderRadius: "8px", padding: "6px 12px", backdropFilter: "blur(8px)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>KNEE ANGLE </span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: angle < 90 ? "var(--accent-green)" : "var(--accent-cyan)", fontFamily: "'Space Grotesk', sans-serif" }}>
              {angle}°
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={feedback}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "8px", background: "rgba(0, 229, 255, 0.05)", border: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Zap size={14} color="var(--accent-cyan)" />
          {feedback}
        </motion.div>
      </AnimatePresence>

      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "var(--accent-cyan)", lineHeight: 1 }}>
            {reps}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>REPS TODAY</div>
        </div>
      </div>
    </div>
  );
}
