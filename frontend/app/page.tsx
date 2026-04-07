"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import RehabVision from "@/components/RehabVision";
import Gamification from "@/components/Gamification";
import PainMap from "@/components/PainMap";
import { Mic, MicOff } from "lucide-react";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

export default function Dashboard() {
  const [isActive, setIsActive] = useState(false);
  const [sessionReps, setSessionReps] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({
    commands: [
      {
        command: ["start my exercises", "start workout", "begin session"],
        callback: () => {
          setIsActive(true);
          resetTranscript();
        },
      },
      {
        command: ["stop my exercises", "end workout", "stop session"],
        callback: () => {
          setIsActive(false);
          resetTranscript();
        },
      },
    ],
  });

  const toggleWorkout = () => {
    setIsActive(!isActive);
  };

  const toggleVoice = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                color: "var(--text-primary)",
              }}
            >
              Good Morning, Alex 👋
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "15px" }}>
              Ready for your daily knee rehabilitation?
            </p>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Voice Command Button */}
            {browserSupportsSpeechRecognition && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: listening ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: listening ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border-subtle)",
                  transition: "all 0.2s",
                }}
              >
                <button
                  onClick={toggleVoice}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: listening ? "var(--accent-red)" : "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {listening ? <Mic size={16} /> : <MicOff size={16} />}
                  {listening ? "LISTENING" : "VOICE NAV"}
                </button>
              </div>
            )}

            <button
              onClick={toggleWorkout}
              className="btn-primary"
              style={{
                background: isActive
                  ? "transparent"
                  : "linear-gradient(135deg, #00b8cc, #0088aa)",
                border: isActive
                  ? "1px solid var(--accent-red)"
                  : "1px solid var(--accent-cyan)",
                color: isActive ? "var(--accent-red)" : "#050b18",
                width: "160px",
              }}
            >
              {isActive ? "End Workout" : "Start Workout"}
            </button>
          </div>
        </header>

        {/* Voice Feedback */}
        {listening && transcript && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: "20px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              display: "inline-block",
            }}
          >
            <em>"{transcript}"</em>
          </div>
        )}

        {/* Grid Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* Main Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <RehabVision
              isActive={isActive}
              onRepComplete={(reps) => setSessionReps(reps)}
            />
          </div>

          {/* Side Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Gamification reps={sessionReps} goalReps={15} />
            <PainMap />
          </div>
        </div>
      </main>
    </div>
  );
}
