import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { ArrowLeft, User, Activity, Calendar, TrendingUp, CheckCircle, Clock, FileText } from "lucide-react";

export default function PatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        // 1) Fetch patient profile
        const { data: profile, error: profileErr } = await supabase
          .from("patients")
          .select("id, full_name, email, rehab_focus")
          .eq("id", patientId)
          .single();

        if (profileErr) {
          console.error("[Kinetix] Patient profile fetch error:", profileErr.message);
        } else {
          setPatient(profile);
        }

        // 2) Fetch assigned routines for this patient under the current doctor
        const { data: session } = await supabase.auth.getSession();
        const doctorId = session?.session?.user?.id;

        const { data: rData, error: rErr } = await supabase
          .from("assigned_routines")
          .select("id, exercise_id, status, assigned_date")
          .eq("patient_id", patientId)
          .eq("doctor_id", doctorId)
          .order("assigned_date", { ascending: false });

        if (rErr) {
          console.error("[Kinetix] Routines fetch error:", rErr.message);
        } else {
          setRoutines(rData || []);
        }

        // 3) Fetch exercises dictionary for display
        const { data: exData } = await supabase
          .from("exercises_dictionary")
          .select("id, name, target_reps");

        if (exData) {
          const map = {};
          exData.forEach((ex) => (map[ex.id] = ex));
          setExercises(map);
        }
      } catch (err) {
        console.error("[Kinetix] PatientProfile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) loadPatientData();
  }, [patientId]);

  const pendingRoutines = routines.filter((r) => r.status === "pending");
  const completedRoutines = routines.filter((r) => r.status === "completed");
  const compliance = routines.length > 0 ? Math.round((completedRoutines.length / routines.length) * 100) : 0;

  const initials = patient?.full_name
    ? patient.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(0,229,255,0.2)", borderTopColor: "var(--accent-cyan)", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/doctor")}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px" }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* Patient Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: "32px", marginBottom: "24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Avatar */}
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(124,58,237,0.2))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", fontWeight: 700, color: "var(--text-primary)",
              fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0,
            }}>
              {initials}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: "28px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
                {patient?.full_name || "Unknown Patient"}
              </h1>
              <div style={{ display: "flex", gap: "20px", marginTop: "8px", color: "var(--text-muted)", fontSize: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={14} /> {patient?.email || "No email"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileText size={14} /> {routines.length} protocols assigned
                </span>
              </div>
            </div>

            {/* Compliance Badge */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: `conic-gradient(${compliance >= 75 ? "var(--accent-green)" : compliance >= 40 ? "var(--accent-amber)" : "var(--accent-red)"} ${compliance * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "var(--bg-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                  color: compliance >= 75 ? "var(--accent-green)" : compliance >= 40 ? "var(--accent-amber)" : "var(--accent-red)",
                }}>
                  {compliance}%
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Compliance</div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Activity size={14} color="var(--accent-cyan)" /> Total Protocols
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{routines.length}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Clock size={14} color="var(--accent-amber)" /> Pending
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--accent-amber)" }}>{pendingRoutines.length}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <CheckCircle size={14} color="var(--accent-green)" /> Completed
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--accent-green)" }}>{completedRoutines.length}</div>
          </motion.div>
        </div>

        {/* Assigned Routines List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
          style={{ padding: "28px" }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={20} color="var(--accent-purple)" /> Assigned Protocols
          </h2>

          {routines.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(124, 58, 237, 0.05)", borderRadius: "12px", border: "1px dashed var(--border-subtle)" }}>
              <Activity size={36} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>No protocols assigned yet</div>
              <div style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "13px" }}>Go back and assign an exercise to this patient.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {routines.map((r) => {
                const ex = exercises[r.exercise_id];
                const isPending = r.status === "pending";
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "16px",
                      padding: "16px", background: "var(--bg-secondary)",
                      borderRadius: "12px", border: "1px solid var(--border-subtle)",
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Status Icon */}
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: isPending ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {isPending
                        ? <Clock size={18} color="var(--accent-amber)" />
                        : <CheckCircle size={18} color="var(--accent-green)" />
                      }
                    </div>

                    {/* Exercise Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>
                        {ex?.name || "Unknown Exercise"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Target: {ex?.target_reps || "—"} reps · Assigned: {new Date(r.assigned_date).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                      background: isPending ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      color: isPending ? "var(--accent-amber)" : "var(--accent-green)",
                      border: `1px solid ${isPending ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
                    }}>
                      {isPending ? "Pending" : "Completed"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
