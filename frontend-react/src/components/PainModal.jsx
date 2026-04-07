import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function PainModal({ isOpen, onClose, bodyPart }) {
  const [pain, setPain] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  const painColors = [
    "#10b981", "#34d399", "#6ee7b7",
    "#fbbf24", "#f59e0b", "#ef4444",
    "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d",
  ];

  const painLabels = [
    "None", "Minimal", "Mild",
    "Moderate", "Moderate", "Noticeable",
    "Strong", "Intense", "Severe", "Worst"
  ];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setPain(3);
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5, 11, 24, 0.8)",
              backdropFilter: "blur(8px)",
              zIndex: 50,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              width: "420px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 0 60px rgba(0, 229, 255, 0.12), 0 25px 50px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--accent-cyan)", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "4px" }}>
                  PAIN LOG
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: "var(--text-primary)",
                  }}
                >
                  {bodyPart}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "20px 0" }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent-green)" }}>
                  Pain Level Logged!
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  Level {pain} — {painLabels[pain - 1]}
                </div>
              </motion.div>
            ) : (
              <>
                {/* Pain indicator */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                  <motion.div
                    key={pain}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: "64px",
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: painColors[pain - 1],
                      lineHeight: 1,
                      textShadow: `0 0 20px ${painColors[pain - 1]}66`,
                    }}
                  >
                    {pain}
                  </motion.div>
                  <div style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "8px" }}>
                    {painLabels[pain - 1]}
                  </div>
                </div>

                {/* Slider */}
                <div style={{ marginBottom: "28px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>1 — No Pain</span>
                    <span>10 — Worst</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={pain}
                    onChange={(e) => setPain(Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: painColors[pain - 1],
                      cursor: "pointer",
                      height: "6px",
                    }}
                  />
                  {/* Color bar */}
                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      marginTop: "8px",
                    }}
                  >
                    {painColors.map((color, i) => (
                      <div
                        key={i}
                        onClick={() => setPain(i + 1)}
                        style={{
                          flex: 1,
                          height: "6px",
                          borderRadius: "3px",
                          background: i < pain ? color : "var(--bg-secondary)",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                  style={{ width: "100%", padding: "13px", fontSize: "15px" }}
                >
                  Log Pain Level
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
