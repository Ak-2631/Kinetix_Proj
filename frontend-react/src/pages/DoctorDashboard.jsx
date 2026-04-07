import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { FileText, Cpu, User, Calendar, Activity, Check } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

function generateClinicalSummary(data) {
  const {
    patientName = "Patient",
    weeklyReps = 0,
    painLevels = [],
    sessionCount = 0,
  } = data;

  const avgPain =
    painLevels.length > 0
      ? (painLevels.reduce((a, b) => a + b, 0) / painLevels.length).toFixed(1)
      : "N/A";

  const painTrend =
    painLevels.length >= 2
      ? painLevels[painLevels.length - 1] < painLevels[0]
        ? "showing improvement"
        : "requiring attention"
      : "within expected parameters";

  const repStatus =
    weeklyReps >= 60
      ? "exceeding targets"
      : weeklyReps >= 30
      ? "meeting targets"
      : "below targets for the week";

  return (
    `${patientName} completed ${weeklyReps} rehabilitation repetitions across ${sessionCount} sessions this week, ${repStatus}. ` +
    `Pain levels averaged ${avgPain}/10 and are ${painTrend}, suggesting the current protocol should ${
      painLevels.length > 0 && Number(avgPain) > 6
        ? "be reviewed by the supervising physician before advancing"
        : "continue with progressive resistance as tolerated"
    }.`
  );
}

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New states for Assign Protocol
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [doctorSession, setDoctorSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setDoctorSession(session);
    });

    const fetchInitialData = async () => {
      // Fetch Patients
      const { data: pts } = await supabase.from('profiles').select('*').eq('role', 'patient');
      if (pts) {
        setPatients(pts);
        if (pts.length > 0) setSelectedPatientId(pts[0].id);
      }

      // Fetch Exercises
      const { data: exrs } = await supabase.from('exercises_dictionary').select('*');
      if (exrs) setExercises(exrs);
    };

    fetchInitialData();

    // Simulate API fetch delay
    const timer = setTimeout(() => {
      const demoData = {
        patientName: "Alex Kumar",
        weeklyReps: 72,
        painLevels: [6, 5, 5, 4, 4, 3, 3],
        sessionCount: 5,
      };

      const summary = generateClinicalSummary(demoData);

      setData({
        summary,
        generatedAt: new Date().toISOString(),
        model: "kinetix-clinical-v1 (browser mock)",
        patient: demoData.patientName,
        rawData: demoData,
      });

      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleAssign = async () => {
    if (!selectedExercise || !selectedPatientId || !doctorSession) return;
    
    setAssigning(true);
    setSuccessMsg("");

    const { error } = await supabase.from('assigned_routines').insert({
      patient_id: selectedPatientId,
      doctor_id: doctorSession.user.id,
      exercise_id: selectedExercise.id,
      status: 'pending'
    });

    setAssigning(false);

    if (error) {
      alert("Error assigning routine: " + error.message);
    } else {
      setSuccessMsg("Protocol assigned successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      setSelectedExercise(null);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(124, 58, 237, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={24} color="var(--accent-purple)" />
            </div>
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
                Clinical Overview
              </h1>
              <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "15px" }}>
                AI-generated summaries of patient progress
              </p>
            </div>
          </div>
          
          <button className="btn-primary" onClick={async () => {
             await supabase.auth.signOut();
             window.location.href = '/';
          }} style={{ background: "transparent", border: "1px solid var(--accent-red)", color: "var(--accent-red)" }}>
            Sign Out
          </button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
          {/* Left Column: AI Summary */}
          <div>
            {loading ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--text-muted)" }}>
                <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid rgba(0,229,255,0.2)", borderTopColor: "var(--accent-cyan)", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
                Analyzing patient data...
              </div>
            ) : data ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ padding: "32px", marginBottom: "24px" }}
              >
                {/* Context bar */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "24px", marginBottom: "24px" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold" }}>
                      AK
                    </div>
                    <div>
                      <h2 style={{ margin: "0 0 4px", fontSize: "20px" }}>{data.patient}</h2>
                      <div style={{ display: "flex", gap: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={14} /> ID: #PT-8492</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> Week 4 Post-Op</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0,229,255,0.1)", padding: "6px 12px", borderRadius: "16px", fontSize: "12px", color: "var(--accent-cyan)", border: "1px solid rgba(0,229,255,0.2)" }}>
                      <Cpu size={14} />
                      {data.model}
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                      Generated {new Date(data.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* AI Summary Content */}
                <div>
                  <div style={{ fontSize: "11px", color: "var(--accent-purple)", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "8px" }}>
                    AI CLINICAL SYNTHESIS
                  </div>
                  <p style={{
                    fontSize: "18px",
                    lineHeight: "1.6",
                    color: "var(--text-primary)",
                    margin: 0,
                  }}>
                    {data.summary}
                  </p>
                </div>

                {/* Key metrics raw data */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Activity size={14} /> Weekly Reps
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {data.rawData?.weeklyReps} <span style={{ fontSize: "14px", color: "var(--accent-green)" }}>↑12%</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Avg Pain (1-10)</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {data.rawData?.painLevels?.length > 0 ? (data.rawData.painLevels.reduce((a, b) => a + b, 0) / data.rawData.painLevels.length).toFixed(1) : "N/A"}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Sessions Completed</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {data.rawData?.sessionCount}/7
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Right Column: Assign Protocol */}
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="card"
             style={{ padding: "24px", flexShrink: 0 }}
          >
             <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>
               Assign Protocol
             </h2>
             
             <div style={{ marginBottom: "20px" }}>
               <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Select Patient</label>
               <select 
                 value={selectedPatientId}
                 onChange={(e) => setSelectedPatientId(e.target.value)}
                 style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
               >
                 {patients.length === 0 ? <option value="">No patients found</option> : null}
                 {patients.map(p => (
                   <option key={p.id} value={p.id}>{p.full_name || 'Anonymous'}</option>
                 ))}
               </select>
             </div>

             <div>
               <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Exercise Library</label>
               <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                 {exercises.map((ex) => {
                   const IconComponent = LucideIcons[ex.lucide_icon_name] || LucideIcons.Activity;
                   const isSelected = selectedExercise?.id === ex.id;
                   
                   return (
                     <div 
                       key={ex.id}
                       onClick={() => setSelectedExercise(ex)}
                       style={{
                         padding: "16px",
                         borderRadius: "12px",
                         background: isSelected ? "rgba(124, 58, 237, 0.2)" : "var(--bg-secondary)",
                         border: isSelected ? "1px solid var(--accent-purple)" : "1px solid transparent",
                         cursor: "pointer",
                         display: "flex",
                         alignItems: "center",
                         gap: "12px",
                         transition: "all 0.2s"
                       }}
                     >
                       <div style={{ color: isSelected ? "var(--accent-purple)" : "var(--accent-cyan)" }}>
                         <IconComponent size={24} />
                       </div>
                       <div>
                         <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>{ex.name}</div>
                         <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{ex.target_reps} reps</div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             <button 
               className="btn-primary" 
               style={{ width: "100%", marginTop: "24px", background: assigning ? "rgba(255,255,255,0.1)" : "" }}
               disabled={!selectedExercise || !selectedPatientId || assigning}
               onClick={handleAssign}
             >
               {assigning ? "Assigning..." : "Assign Exercise"}
             </button>

             {successMsg && (
               <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-green)", fontSize: "14px", justifyContent: "center" }}>
                 <Check size={16} /> {successMsg}
               </div>
             )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
