import { useState } from "react";
import PainModal from "./PainModal";

const bodyParts = [
  { id: "left-knee", label: "Left Knee", cx: 148, cy: 320, r: 18, active: true },
  { id: "right-knee", label: "Right Knee", cx: 192, cy: 320, r: 18, active: false },
  { id: "left-hip", label: "Left Hip", cx: 148, cy: 220, r: 16, active: false },
  { id: "right-hip", label: "Right Hip", cx: 192, cy: 220, r: 16, active: false },
  { id: "lower-back", label: "Lower Back", cx: 170, cy: 198, r: 18, active: false },
];

export default function PainMap() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState("");
  const [hoveredPart, setHoveredPart] = useState(null);

  const handleClick = (part) => {
    if (part.active) {
      setSelectedPart(part.label);
      setModalOpen(true);
    }
  };

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "var(--accent-cyan)", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "4px" }}>
          PAIN TRACKING
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: "var(--text-primary)",
          }}
        >
          Interactive Body Map
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
          Click highlighted zones to log pain
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "340px", height: "480px" }}>
          <svg
            viewBox="0 0 340 480"
            width="340"
            height="480"
            style={{ display: "block" }}
          >
            <defs>
              <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#1a3a5c" />
                <stop offset="100%" stopColor="#0a1e35" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Body silhouette */}
            {/* Head */}
            <ellipse cx="170" cy="52" rx="34" ry="40" fill="url(#bodyGrad)" stroke="#1e4a7a" strokeWidth="1.5" />
            {/* Neck */}
            <rect x="158" y="88" width="24" height="20" rx="6" fill="url(#bodyGrad)" stroke="#1e4a7a" strokeWidth="1.5" />
            {/* Torso */}
            <path
              d="M120 105 Q100 115 95 160 Q90 200 100 235 L160 240 L180 240 L240 235 Q250 200 245 160 Q240 115 220 105 Z"
              fill="url(#bodyGrad)"
              stroke="#1e4a7a"
              strokeWidth="1.5"
            />
            {/* Left arm */}
            <path d="M120 108 Q100 140 95 190 Q92 220 98 245" stroke="#1e4a7a" strokeWidth="24" strokeLinecap="round" fill="none" />
            <path d="M120 108 Q100 140 95 190 Q92 220 98 245" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            {/* Right arm */}
            <path d="M220 108 Q240 140 245 190 Q248 220 242 245" stroke="#1e4a7a" strokeWidth="24" strokeLinecap="round" fill="none" />
            <path d="M220 108 Q240 140 245 190 Q248 220 242 245" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            {/* Left hand */}
            <ellipse cx="98" cy="252" rx="12" ry="10" fill="url(#bodyGrad)" stroke="#1e4a7a" strokeWidth="1.5" />
            {/* Right hand */}
            <ellipse cx="242" cy="252" rx="12" ry="10" fill="url(#bodyGrad)" stroke="#1e4a7a" strokeWidth="1.5" />
            {/* Left leg upper */}
            <path d="M140 238 Q132 275 130 310" stroke="#1e4a7a" strokeWidth="36" strokeLinecap="round" fill="none" />
            <path d="M140 238 Q132 275 130 310" stroke="url(#bodyGrad)" strokeWidth="32" strokeLinecap="round" fill="none" />
            {/* Right leg upper */}
            <path d="M200 238 Q208 275 210 310" stroke="#1e4a7a" strokeWidth="36" strokeLinecap="round" fill="none" />
            <path d="M200 238 Q208 275 210 310" stroke="url(#bodyGrad)" strokeWidth="32" strokeLinecap="round" fill="none" />
            {/* Left leg lower */}
            <path d="M130 320 Q128 355 130 390" stroke="#1e4a7a" strokeWidth="30" strokeLinecap="round" fill="none" />
            <path d="M130 320 Q128 355 130 390" stroke="url(#bodyGrad)" strokeWidth="26" strokeLinecap="round" fill="none" />
            {/* Right leg lower */}
            <path d="M210 320 Q212 355 210 390" stroke="#1e4a7a" strokeWidth="30" strokeLinecap="round" fill="none" />
            <path d="M210 320 Q212 355 210 390" stroke="url(#bodyGrad)" strokeWidth="26" strokeLinecap="round" fill="none" />
            {/* Left foot */}
            <ellipse cx="130" cy="402" rx="18" ry="12" fill="url(#bodyGrad)" stroke="#1e4a7a" strokeWidth="1.5" />
            {/* Right foot */}
            <ellipse cx="210" cy="402" rx="18" ry="12" fill="url(#bodyGrad)" stroke="#1e4a7a" strokeWidth="1.5" />

            {/* Spine indicator */}
            {[120, 140, 160, 180, 200].map((y, i) => (
              <circle key={i} cx="170" cy={y} r="2.5" fill="#1e5a80" opacity="0.6" />
            ))}

            {/* Clickable body part zones */}
            {bodyParts.map((part) => {
              const isHovered = hoveredPart === part.id;
              return (
                <g key={part.id}>
                  {part.active && (
                    <circle
                      cx={part.cx}
                      cy={part.cy}
                      r={part.r + 6}
                      fill="rgba(0, 229, 255, 0.05)"
                      style={{
                        animation: "pulse-glow 2s ease-in-out infinite",
                      }}
                    />
                  )}
                  <circle
                    cx={part.cx}
                    cy={part.cy}
                    r={part.r}
                    fill={
                      part.active
                        ? isHovered
                          ? "rgba(239, 68, 68, 0.5)"
                          : "rgba(239, 68, 68, 0.3)"
                        : "rgba(100, 150, 200, 0.1)"
                    }
                    stroke={
                      part.active
                        ? isHovered
                          ? "#ef4444"
                          : "rgba(239, 68, 68, 0.6)"
                        : "rgba(100, 150, 200, 0.2)"
                    }
                    strokeWidth={part.active ? "2" : "1"}
                    cursor={part.active ? "pointer" : "default"}
                    filter={part.active ? "url(#glow)" : "none"}
                    onClick={() => handleClick(part)}
                    onMouseEnter={() => setHoveredPart(part.id)}
                    onMouseLeave={() => setHoveredPart(null)}
                    style={{ transition: "all 0.2s ease" }}
                  />
                  {part.active && (
                    <text
                      x={part.cx}
                      y={part.cy + 36}
                      textAnchor="middle"
                      fill={isHovered ? "#ef4444" : "rgba(239, 68, 68, 0.7)"}
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                      style={{ pointerEvents: "none" }}
                    >
                      {part.label.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.5)", border: "1px solid #ef4444" }} />
          Active Zone (clickable)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(100, 150, 200, 0.1)", border: "1px solid rgba(100,150,200,0.3)" }} />
          Inactive Zone
        </div>
      </div>

      <PainModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bodyPart={selectedPart}
      />
    </div>
  );
}
