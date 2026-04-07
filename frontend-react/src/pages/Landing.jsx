import { motion } from "framer-motion";
import { User, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ textAlign: "center", width: "100%", maxWidth: "800px" }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "40px", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "8px", fontWeight: "bold" }}
        >
          Welcome to <span style={{ color: "var(--accent-cyan)" }}>Kinetix</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ color: "var(--text-secondary)", marginBottom: "40px", fontSize: "18px" }}
        >
          Are you a Patient or a Clinician?
        </motion.p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{ padding: "40px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            onClick={() => navigate('/login/patient')}
          >
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(0, 229, 255, 0.1)", color: "var(--accent-cyan)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <User size={40} />
            </div>
            <h2 style={{ fontSize: "24px", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 10px 0" }}>Patient</h2>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Access your daily rehabilitation routines</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: "40px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            onClick={() => navigate('/login/doctor')}
          >
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(124, 58, 237, 0.1)", color: "var(--accent-purple)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Stethoscope size={40} />
            </div>
            <h2 style={{ fontSize: "24px", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 10px 0" }}>Clinician</h2>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Assign and monitor patient protocols</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
