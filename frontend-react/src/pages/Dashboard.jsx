import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import RehabVision from "@/components/RehabVision";
import Gamification from "@/components/Gamification";
import PainMap from "@/components/PainMap";
import { Mic, MicOff, Check, Play, FileText } from "lucide-react";
import * as LucideIcons from "lucide-react";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [isActive, setIsActive] = useState(false);
  const [sessionReps, setSessionReps] = useState(0);
  const [routines, setRoutines] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    const fetchRoutines = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('assigned_routines')
        .select(`
          id, status, assigned_date,
          exercise:exercises_dictionary (
            id, name, description, lucide_icon_name, target_reps, target_angle
          )
        `)
        .eq('patient_id', session.user.id)
        .eq('status', 'pending');
        
      if (data) {
         setRoutines(data);
      }

      // Fetch Patient Profile & Clinical Notes
      const { data: profile } = await supabase
        .from('patients')
        .select('full_name, clinical_summary')
        .eq('id', session.user.id)
        .single();
        
      if (profile) setPatientProfile(profile);

      setLoadingTasks(false);
    };
    
    fetchRoutines();
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
          if (routines.length > 0) {
            startExercise(routines[0]);
          } else {
            setIsActive(true); 
          }
          resetTranscript();
        },
      },
      {
        command: ["stop my exercises", "end workout", "stop session"],
        callback: () => {
          setIsActive(false);
          setActiveRoutine(null);
          resetTranscript();
        },
      },
    ],
  });

  const startExercise = (routine) => {
    setActiveRoutine(routine);
    setIsActive(true);
  };

  const completeRoutine = async () => {
    if (activeRoutine) {
      await supabase
        .from('assigned_routines')
        .update({ status: 'completed' })
        .eq('id', activeRoutine.id);
        
      setRoutines(routines.filter(r => r.id !== activeRoutine.id));
    }
    setIsActive(false);
    setActiveRoutine(null);
    setSessionReps(0);
  };

  const toggleWorkout = () => {
    if (isActive) {
      completeRoutine(); 
    } else if (routines.length > 0) {
      startExercise(routines[0]);
    } else {
      setIsActive(true);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

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
              Good Morning{patientProfile?.full_name ? `, ${patientProfile.full_name.split(' ')[0]}` : ''} 👋
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "15px" }}>
              Ready for your daily rehabilitation?
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
              onClick={async () => {
                 await supabase.auth.signOut();
                 window.location.href = '/';
              }}
              className="btn-primary"
              style={{ background: "transparent", border: "1px solid var(--accent-red)", color: "var(--accent-red)", padding: "10px 16px" }}
            >
              Sign Out
            </button>

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
              {isActive ? "End Protocol" : "Quick Start"}
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
            
            {!isActive && (
              <div className="card" style={{ padding: "24px", marginBottom: "8px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>Today's Routine</h2>
                {loadingTasks ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading your routine...</div>
                ) : routines.length === 0 ? (
                  <div style={{ 
                    padding: "40px", 
                    textAlign: "center", 
                    background: "rgba(0, 229, 255, 0.05)", 
                    borderRadius: "12px", 
                    border: "1px dashed var(--border-subtle)" 
                  }}>
                    <Check size={40} color="var(--accent-green)" style={{ margin: "0 auto 16px" }} />
                    <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>All caught up!</div>
                    <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>No protocols assigned for today.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {routines.map((routine) => {
                      const IconComponent = routine.exercise?.lucide_icon_name && LucideIcons[routine.exercise.lucide_icon_name] 
                        ? LucideIcons[routine.exercise.lucide_icon_name] 
                        : LucideIcons.Activity;

                      return (
                        <div key={routine.id} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "16px", background: "var(--bg-secondary)", borderRadius: "12px",
                          border: "1px solid var(--border-subtle)",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(0, 229, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-cyan)" }}>
                              <IconComponent size={24} />
                            </div>
                            <div>
                              <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>{routine.exercise?.name || 'Exercise Protocol'}</h3>
                              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                {routine.exercise?.target_reps ? `${routine.exercise.target_reps} Reps Target` : 'As tolerated'}
                              </div>
                            </div>
                          </div>
                          
                          <button onClick={() => startExercise(routine)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Play size={16} fill="currentColor" /> Start
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <RehabVision
              isActive={isActive}
              onRepComplete={(reps) => setSessionReps(reps)}
            />
          </div>

          {/* Side Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {patientProfile?.clinical_summary && (
              <div 
                className="card" 
                style={{ 
                  padding: "24px", 
                  background: "rgba(124, 58, 237, 0.05)", 
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  animation: "fadeIn 0.5s ease-out"
                }}
              >
                <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "var(--accent-purple)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={18} /> Doctor's Clinical Notes
                </h3>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)" }}>
                  {patientProfile.clinical_summary}
                </p>
              </div>
            )}
            
            <Gamification reps={sessionReps} goalReps={activeRoutine?.exercise?.target_reps || 15} />
            <PainMap />
          </div>
        </div>
      </main>
    </div>
  );
}
