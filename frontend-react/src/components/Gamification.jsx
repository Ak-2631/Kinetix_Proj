import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import { Trophy, TrendingUp } from "lucide-react";

export default function Gamification({ reps, goalReps = 10 }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [milestone, setMilestone] = useState(null);

  const progressPct = Math.min((reps / goalReps) * 100, 100);
  const circumference = 2 * Math.PI * 54; // radius 54
  const strokeDash = (progressPct / 100) * circumference;

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (reps > 0 && reps % 3 === 0) {
      setMilestone(reps);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [reps]);

  const level = Math.floor(reps / 5) + 1;
  const badges = [
    { label: "First Rep", icon: "🏃", unlocked: reps >= 1 },
    { label: "Triple", icon: "🌟", unlocked: reps >= 3 },
    { label: "High Five", icon: "🖐️", unlocked: reps >= 5 },
    { label: "Decade", icon: "🏆", unlocked: reps >= 10 },
  ];

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={280}
          gravity={0.25}
          colors={["#00e5ff", "#7c3aed", "#10b981", "#f59e0b", "#ffffff"]}
          style={{ zIndex: 100, position: "fixed", top: 0, left: 0 }}
        />
      )}

      <div className="card" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--accent-purple)", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "4px" }}>
              GAMIFICATION
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
              Recovery Velocity
            </h3>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a78bfa",
            }}
          >
            Lvl {level}
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{ position: "relative", width: "140px", height: "140px" }}>
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
              {/* Background ring */}
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke="rgba(124, 58, 237, 0.1)"
                strokeWidth="10"
              />
              {/* Progress ring */}
              <motion.circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke="url(#progressGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - strokeDash }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e5ff" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center text */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.div
                key={reps}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: "linear-gradient(135deg, #00e5ff, #7c3aed)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1,
                }}
              >
                {Math.round(progressPct)}%
              </motion.div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                {reps}/{goalReps} reps
              </div>
            </div>
          </div>
        </div>

        {/* Milestone popup */}
        <AnimatePresence>
          {showConfetti && milestone && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(0,229,255,0.1), rgba(124,58,237,0.1))",
                border: "1px solid rgba(0, 229, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Trophy size={20} color="var(--accent-amber)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                  Milestone reached — {milestone} reps! 🎉
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  Keep going, you're crushing it!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badges */}
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px", letterSpacing: "0.5px" }}>
            ACHIEVEMENTS
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {badges.map((badge) => (
              <motion.div
                key={badge.label}
                animate={badge.unlocked ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: badge.unlocked
                    ? "rgba(0, 229, 255, 0.08)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${badge.unlocked ? "rgba(0,229,255,0.25)" : "var(--border-subtle)"}`,
                  opacity: badge.unlocked ? 1 : 0.35,
                  minWidth: "64px",
                }}
              >
                <span style={{ fontSize: "22px" }}>{badge.icon}</span>
                <span style={{ fontSize: "9px", color: badge.unlocked ? "var(--accent-cyan)" : "var(--text-muted)", fontWeight: 600, letterSpacing: "0.3px" }}>
                  {badge.label.toUpperCase()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Streak */}
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TrendingUp size={16} color="var(--accent-green)" />
          <div>
            <span style={{ fontSize: "13px", color: "var(--accent-green)", fontWeight: 600 }}>
              4-day streak 🔥
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "6px" }}>
              Don't break it!
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
