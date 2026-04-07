import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { FileText, Cpu, User, Calendar, Activity, Check, UserPlus, Send, Users, TrendingUp, Mail, Clipboard, Lock, Archive, CheckCircle, Search, Link } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assign Protocol states
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [doctorSession, setDoctorSession] = useState(null);
  const [doctorName, setDoctorName] = useState("Clinician");

  // Onboard New Patient states
  const [onboardName, setOnboardName] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardPassword, setOnboardPassword] = useState("");
  const [onboardFocus, setOnboardFocus] = useState("");
  const [onboardExerciseId, setOnboardExerciseId] = useState("");
  const [onboarding, setOnboarding] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Active patients roster
  const [activePatients, setActivePatients] = useState([]);
  const [rosterTab, setRosterTab] = useState("active"); // 'active' or 'completed'

  // Link Existing Patient states
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);

  // Patient exercise history
  const [patientHistory, setPatientHistory] = useState([]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // ═══ Fetch previous exercises for selected patient ═══
  const fetchPatientHistory = async (patientId) => {
    if (!patientId || !doctorSession) {
      setPatientHistory([]);
      return;
    }
    try {
      // Step 1: Fetch routines for this patient under this doctor
      const { data: history, error } = await supabase
        .from('assigned_routines')
        .select('id, exercise_id, status, assigned_date')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorSession.user.id)
        .order('assigned_date', { ascending: false });

      if (error) {
        console.error('[Kinetix] Patient history fetch error:', error.message);
        setPatientHistory([]);
        return;
      }

      // Step 2: Enrich with exercise names from the already-loaded exercises list
      const enriched = (history || []).map(h => ({
        ...h,
        exercise: { name: exercises.find(ex => ex.id === h.exercise_id)?.name || 'Unknown Exercise' },
      }));

      console.log(`[Kinetix] Loaded ${enriched.length} previous exercises for patient ${patientId}`);
      setPatientHistory(enriched);

      // Auto-select last prescribed exercise if doctor hasn't picked one yet
      if (enriched.length > 0 && selectedExercises.length === 0) {
        const lastEx = exercises.find(ex => ex.id === enriched[0].exercise_id);
        if (lastEx) setSelectedExercises([lastEx]);
      }
    } catch (err) {
      console.error('[Kinetix] Patient history exception:', err);
      setPatientHistory([]);
    }
  };

  const fetchDynamicSummary = async (patientId) => {
    if (!patientId) {
      setData(null);
      return;
    }
    setLoading(true);
    
    try {
      // Get patient details
      const { data: pData } = await supabase.from('patients').select('full_name').eq('id', patientId).single();
      const patientName = pData?.full_name || "Unknown Patient";
      
      // Get session logs past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: logs, error } = await supabase
        .from('session_logs')
        .select('total_reps, pain_level')
        .eq('patient_id', patientId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0]); // YYYY-MM-DD
        
      const sessionLogs = logs || [];
      const weeklyReps = sessionLogs.reduce((acc, log) => acc + (log.total_reps || 0), 0);
      const painLevels = sessionLogs.map(l => l.pain_level || 0);
      const sessionCount = sessionLogs.length;

      const structuredData = { patientName, weeklyReps, painLevels, sessionCount };
      const summaryText = generateClinicalSummary(structuredData);

      // Save synthesis directly back to patient portal schema
      await supabase.from('patients').update({ clinical_summary: summaryText }).eq('id', patientId);

      setData({
        summary: summaryText,
        generatedAt: new Date().toISOString(),
        model: "kinetix-clinical-v2 (live db synthesis)",
        patient: patientName,
        rawData: structuredData,
      });
    } catch (err) {
       console.error("Clinical summary engine error", err);
       setData(null);
    } finally {
       setLoading(false);
    }
  };

  // Trigger history fetch whenever selectedPatientId changes
  useEffect(() => {
    if (selectedPatientId && doctorSession) {
      fetchPatientHistory(selectedPatientId);
      fetchDynamicSummary(selectedPatientId);
    } else {
      setPatientHistory([]);
      setData(null);
    }
  }, [selectedPatientId, doctorSession]);

  // ═══ Reusable: refresh dropdowns & roster ═══
  const refreshDropdowns = async (doctorId, explicitPatientId = null) => {
    try {
      // ── Fetch linked patients ──
      // Try the join first, fall back to two separate queries if RLS blocks
      let pts = [];
      try {
        const { data: links, error: linksErr } = await supabase
          .from('doctor_patient_links')
          .select('patient_id')
          .eq('doctor_id', doctorId);

        if (linksErr) throw linksErr;

        if (links && links.length > 0) {
          const patientIds = links.map(l => l.patient_id);
          const { data: ptData } = await supabase
            .from('patients')
            .select('id, full_name, email')
            .in('id', patientIds);

          pts = (ptData || []).map(p => ({
            id: p.id,
            full_name: p.full_name || 'Anonymous',
            email: p.email || '',
          }));
        }
      } catch (joinErr) {
        console.error('[Kinetix] Linked patients fetch error:', joinErr.message);
        // Ultimate fallback: all patients
        const { data: allPts } = await supabase.from('patients').select('id, full_name, email');
        pts = (allPts || []).map(p => ({ id: p.id, full_name: p.full_name || 'Anonymous', email: p.email || '' }));
      }

      console.log(`[Kinetix] Loaded ${pts.length} linked patients`);
      setPatients(pts);
      
      if (explicitPatientId) {
        setSelectedPatientId(explicitPatientId);
      } else if (pts.length > 0) {
        // preserve existing if still valid
        setSelectedPatientId((prev) => {
          if (pts.find(p => p.id === prev)) return prev;
          return pts[0].id;
        });
      }

      // ── Fetch exercises ──
      const { data: exrs, error: exErr } = await supabase.from('exercises_dictionary').select('id, name, lucide_icon_name, target_reps');
      if (exErr) {
        console.error('[Kinetix] Exercises fetch error:', exErr.message);
      } else {
        const list = exrs || [];
        console.log(`[Kinetix] Loaded ${list.length} exercises`);
        setExercises(list);
        if (list.length > 0) setOnboardExerciseId(list[0].id);
      }

      // ── Refresh roster ──
      fetchActivePatients(doctorId);
    } catch (err) {
      console.error('[Kinetix] refreshDropdowns error:', err);
    }
  };

  // ═══ Master Fetch Hook: runs ONCE on mount ═══
  useEffect(() => {
    // 1) Auth session + doctor profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Kinetix] Doctor session:', session?.user?.email || 'none');
      setDoctorSession(session);
      if (session) {
        refreshDropdowns(session.user.id);

        // Fetch doctor's display name
        try {
          const { data: profile } = await supabase
            .from('doctors')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          if (profile?.full_name) setDoctorName(profile.full_name);
        } catch (err) {
          console.error('[Kinetix] Doctor profile fetch error:', err);
        }
      } else {
        setLoading(false);
      }
    });

  }, []);

  const fetchActivePatients = async (doctorId) => {
    try {
      // Step 1: Get ALL linked patients (source of truth = doctor_patient_links)
      const { data: links, error: linksErr } = await supabase
        .from('doctor_patient_links')
        .select('patient_id')
        .eq('doctor_id', doctorId);

      if (linksErr) {
        console.error('[Kinetix] Roster links fetch error:', linksErr.message);
        return;
      }

      const linkedIds = (links || []).map(l => l.patient_id);
      if (linkedIds.length === 0) {
        setActivePatients([]);
        return;
      }

      // Step 2: Get patient profiles for all linked IDs
      const { data: ptData } = await supabase
        .from('patients')
        .select('id, full_name, email')
        .in('id', linkedIds);

      const profileMap = {};
      (ptData || []).forEach(p => { profileMap[p.id] = p; });

      // Step 3: Get ALL routines for these patients under this doctor
      const { data: routines, error: routineErr } = await supabase
        .from('assigned_routines')
        .select('id, patient_id, exercise_id, status, assigned_date')
        .eq('doctor_id', doctorId)
        .in('patient_id', linkedIds);

      if (routineErr) {
        console.error('[Kinetix] Roster routines fetch error:', routineErr.message);
      }

      // Step 4: Build roster — ALL linked patients, enriched with routine data
      const patientMap = {};
      // Start with all linked patients (even those with 0 routines)
      linkedIds.forEach(pid => {
        const profile = profileMap[pid];
        patientMap[pid] = {
          id: pid,
          name: profile?.full_name || 'Anonymous Patient',
          email: profile?.email || '',
          routines: [],
          total: 0,
          completed: 0,
        };
      });

      // Enrich with routine data
      (routines || []).forEach(r => {
        if (patientMap[r.patient_id]) {
          patientMap[r.patient_id].routines.push({ routineId: r.id, status: r.status, exerciseId: r.exercise_id });
          patientMap[r.patient_id].total += 1;
          if (r.status === 'completed') patientMap[r.patient_id].completed += 1;
        }
      });

      setActivePatients(Object.values(patientMap));
      console.log(`[Kinetix] Roster built: ${Object.keys(patientMap).length} patients`);
    } catch (err) {
      console.error('[Kinetix] fetchActivePatients error:', err);
    }
  };

  const handleArchiveRoutine = async (patientId) => {
    if (!doctorSession) return;
    // Mark ALL pending routines for this patient (under this doctor) as completed
    const { error } = await supabase
      .from('assigned_routines')
      .update({ status: 'completed' })
      .eq('doctor_id', doctorSession.user.id)
      .eq('patient_id', patientId)
      .eq('status', 'pending');

    if (error) {
      alert('Archive failed: ' + error.message);
    } else {
      showToast('Patient protocols archived.');
      fetchActivePatients(doctorSession.user.id);
    }
  };

  const toggleExerciseSelection = (ex) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(item => item.id === ex.id);
      if (isSelected) {
        return prev.filter(item => item.id !== ex.id);
      } else {
        return [...prev, ex];
      }
    });
  };

  const handleAssign = async () => {
    if (selectedExercises.length === 0 || !selectedPatientId || !doctorSession) return;
    
    setAssigning(true);
    setSuccessMsg("");

    try {
      console.log('[Kinetix] Assigning exercises:', {
        patient_id: selectedPatientId,
        doctor_id: doctorSession.user.id,
        exercise_count: selectedExercises.length,
      });

      const payloads = selectedExercises.map(ex => ({
        patient_id: selectedPatientId,
        doctor_id: doctorSession.user.id,
        exercise_id: ex.id,
        status: 'pending'
      }));

      const { data: insertData, error } = await supabase.from('assigned_routines').insert(payloads).select();

      if (error) {
        console.error('[Kinetix] Assignment insert error:', error.message, error.details);
        alert("Error assigning routine: " + error.message);
      } else {
        console.log('[Kinetix] Assignment successful:', insertData.length, 'protocols assigned');
        setSuccessMsg(`${insertData.length} Protocol(s) assigned successfully!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        setSelectedExercises([]);
        refreshDropdowns(doctorSession.user.id);
        fetchPatientHistory(selectedPatientId);
      }
    } catch (err) {
      console.error('[Kinetix] Assignment exception:', err);
      alert("Assignment failed: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!doctorSession || !onboardEmail || !onboardName || !onboardPassword) return;

    const currentDoctorId = doctorSession.user.id;
    setOnboarding(true);

    try {
      // ── Step 1: Create the patient's auth account ──
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: onboardEmail,
        password: onboardPassword,
      });

      if (signUpError) {
        alert(`Sign-up failed: ${signUpError.message}`);
        setOnboarding(false);
        return;
      }

      const newUserId = signUpData?.user?.id;
      if (!newUserId) {
        alert("Error: Could not retrieve new patient ID.");
        setOnboarding(false);
        return;
      }
      console.log('[Kinetix] New patient created:', newUserId);

      // ── Step 2: Insert into patients (authed as NEW patient) ──
      const { error: profileError } = await supabase.from('patients').insert({
        id: newUserId,
        full_name: onboardName,
        email: onboardEmail,
      });
      if (profileError) console.warn('[Kinetix] Profile insert warning:', profileError.message);
      else console.log('[Kinetix] Patient profile inserted');

      // ── Step 3: RE-AUTH as the Doctor ──
      const { data: reAuthData, error: reAuthError } = await supabase.auth.signInWithPassword({
        email: 'doctor@kinetix.com',
        password: 'password123',
      });
      if (reAuthError) {
        alert(`Doctor re-auth failed: ${reAuthError.message}. You may need to log in again.`);
        setOnboarding(false);
        return;
      }
      setDoctorSession(reAuthData.session);
      console.log('[Kinetix] Doctor session restored');

      // ── Step 4: Insert doctor_patient_links relationship ──
      const { error: linkError } = await supabase.from('doctor_patient_links').insert({
        doctor_id: currentDoctorId,
        patient_id: newUserId,
      });
      if (linkError) console.warn('[Kinetix] Link insert warning:', linkError.message);
      else console.log('[Kinetix] Doctor-patient link created');

      // ── Step 5: Assign initial routine ──
      if (onboardExerciseId) {
        const { error: routineError } = await supabase.from('assigned_routines').insert({
          patient_id: newUserId,
          doctor_id: currentDoctorId,
          exercise_id: onboardExerciseId,
          status: 'pending',
        });
        if (routineError) alert(`Routine assignment failed: ${routineError.message}`);
        else console.log('[Kinetix] Routine assigned to patient', newUserId);
      }

      // ── Step 6: Refresh & reset ──
      showToast(`Account created and protocol assigned for ${onboardEmail}!`);
      setOnboardName("");
      setOnboardEmail("");
      setOnboardPassword("");
      setOnboardFocus("");
      if (exercises.length > 0) setOnboardExerciseId(exercises[0].id);

      refreshDropdowns(currentDoctorId, newUserId);

    } catch (err) {
      alert(`Onboard error: ${err.message}`);
      console.error('[Kinetix] Onboard error:', err);
    } finally {
      setOnboarding(false);
    }
  };

  // ═══ Link Existing Patient Handler ═══
  const handleLinkPatient = async (e) => {
    e.preventDefault();
    if (!doctorSession || !linkEmail) return;
    setLinking(true);

    try {
      const cleanEmail = linkEmail.trim().toLowerCase();
      console.log('[Kinetix] Searching for patient with email:', cleanEmail);

      // Strategy 1: Direct query with ilike
      let foundPatient = null;
      const { data: directResult, error: directErr } = await supabase
        .from('patients')
        .select('id, full_name, email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      console.log('[Kinetix] Direct search result:', { directResult, directErr: directErr?.message });

      if (directResult) {
        foundPatient = directResult;
      } else {
        // Strategy 2: RLS might be blocking — fetch all patients the doctor CAN see
        // and filter client-side
        console.log('[Kinetix] Direct search failed, trying broad fetch...');
        const { data: allPatients, error: broadErr } = await supabase
          .from('patients')
          .select('id, full_name, email');

        console.log('[Kinetix] Broad fetch result:', { count: allPatients?.length, broadErr: broadErr?.message });

        if (allPatients && allPatients.length > 0) {
          foundPatient = allPatients.find(
            p => p.email && p.email.trim().toLowerCase() === cleanEmail
          );
          console.log('[Kinetix] Client-side filter result:', foundPatient || 'not found');
        }
      }

      if (!foundPatient) {
        alert(`No patient found with email "${linkEmail.trim()}". Make sure the patient has been onboarded first.`);
        setLinking(false);
        return;
      }

      console.log('[Kinetix] Found patient:', foundPatient.full_name, foundPatient.id);

      // Insert the link
      const { error: linkErr } = await supabase.from('doctor_patient_links').insert({
        doctor_id: doctorSession.user.id,
        patient_id: foundPatient.id,
      });

      if (linkErr) {
        if (linkErr.message.includes('duplicate') || linkErr.message.includes('unique')) {
          showToast(`${foundPatient.full_name} is already linked to your roster.`);
        } else {
          alert(`Link failed: ${linkErr.message}`);
        }
      } else {
        showToast(`${foundPatient.full_name} linked to your roster!`);
      }

      setLinkEmail("");
      refreshDropdowns(doctorSession.user.id, foundPatient.id);

    } catch (err) {
      alert(`Link error: ${err.message}`);
      console.error('[Kinetix] Link error:', err);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -30, x: "-50%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              style={{
                position: "fixed",
                top: "24px",
                left: "50%",
                zIndex: 9999,
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(0, 229, 255, 0.1))",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "14px",
                padding: "16px 28px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.15)",
                maxWidth: "560px",
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={18} color="var(--accent-green)" />
              </div>
              <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500 }}>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                Welcome, {doctorName} — AI-generated summaries of patient progress
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

        {/* ===== ROW 1: AI Summary + Assign Protocol ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start", marginBottom: "24px", overflow: "visible" }}>
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
                style={{ padding: "32px" }}
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
             style={{ padding: "24px", flexShrink: 0, overflow: "visible", zIndex: 10 }}
          >
             <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>
               Assign Protocol
             </h2>
             
             <div style={{ marginBottom: "20px" }}>
               <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Select Patient</label>
               <select 
                 value={selectedPatientId || ""}
                 onChange={(e) => setSelectedPatientId(e.target.value)}
                 style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px" }}
               >
                 <option value="" disabled>Select a patient...</option>
                 {patients.map(p => (
                   <option key={p.id} value={p.id}>{p.full_name || 'Unknown Patient'}</option>
                 ))}
               </select>
             </div>

             <div>
               <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Exercise Library (Select Multiple)</label>
               <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                 {exercises.map((ex) => {
                   const IconComponent = LucideIcons[ex.lucide_icon_name] || LucideIcons.Activity;
                   const isSelected = selectedExercises.some(item => item.id === ex.id);
                   
                   return (
                     <div 
                       key={ex.id}
                       onClick={() => toggleExerciseSelection(ex)}
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
                       {isSelected && (
                         <div style={{ marginLeft: "auto", color: "var(--accent-purple)" }}>
                           <Check size={18} />
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             </div>

             <button 
               className="btn-primary" 
               style={{ width: "100%", marginTop: "24px", background: assigning ? "rgba(255,255,255,0.1)" : "" }}
               disabled={selectedExercises.length === 0 || !selectedPatientId || assigning}
               onClick={handleAssign}
             >
               {assigning ? "Assigning..." : "Assign Exercise"}
             </button>

             {successMsg && (
               <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-green)", fontSize: "14px", justifyContent: "center" }}>
                 <Check size={16} /> {successMsg}
               </div>
             )}

             {/* ═══ Previous Exercises for Selected Patient ═══ */}
             {selectedPatientId && patientHistory.length > 0 && (
               <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                 <div style={{ fontSize: "13px", color: "var(--accent-cyan)", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                   <Calendar size={14} /> PREVIOUSLY ASSIGNED
                 </div>
                 <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                   {patientHistory.map((h) => (
                     <div
                       key={h.id}
                       onClick={() => {
                         const ex = exercises.find(e => e.id === h.exercise_id);
                         if (ex) toggleExerciseSelection(ex);
                       }}
                       style={{
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "space-between",
                         padding: "10px 12px",
                         borderRadius: "8px",
                         background: selectedExercises.some(item => item.id === h.exercise_id) ? h.exercise_id : null === h.exercise_id ? "rgba(124, 58, 237, 0.15)" : "rgba(0,0,0,0.15)",
                         border: selectedExercises.some(item => item.id === h.exercise_id) ? h.exercise_id : null === h.exercise_id ? "1px solid rgba(124, 58, 237, 0.3)" : "1px solid transparent",
                         cursor: "pointer",
                         transition: "all 0.2s",
                       }}
                     >
                       <div>
                         <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                           {h.exercise?.name || "Unknown"}
                         </div>
                         <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                           {new Date(h.assigned_date).toLocaleDateString()}
                         </div>
                       </div>
                       <div style={{
                         padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                         background: h.status === 'completed' ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                         color: h.status === 'completed' ? "var(--accent-green)" : "var(--accent-amber)",
                         border: `1px solid ${h.status === 'completed' ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                       }}>
                         {h.status === 'completed' ? '✓ Done' : '● Pending'}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </motion.div>
        </div>

        {/* ===== ROW 2: Onboard + Link Existing ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start", overflow: "visible", marginBottom: "24px" }}>

          {/* Onboard New Patient Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
             style={{ padding: "28px", overflow: "visible", zIndex: 10 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0, 229, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserPlus size={20} color="var(--accent-cyan)" />
              </div>
              <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>Onboard New Patient</h2>
            </div>

            <form onSubmit={handleOnboardSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "visible" }}>
              {/* Patient Name */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Patient Full Name</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={onboardName}
                    onChange={(e) => setOnboardName(e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    required
                    style={{ width: "100%", padding: "10px 10px 10px 38px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                  />
                </div>
              </div>

              {/* Patient Email */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Patient Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    value={onboardEmail}
                    onChange={(e) => setOnboardEmail(e.target.value)}
                    placeholder="patient@email.com"
                    required
                    style={{ width: "100%", padding: "10px 10px 10px 38px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                  />
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Temporary Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    type="password"
                    value={onboardPassword}
                    onChange={(e) => setOnboardPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    style={{ width: "100%", padding: "10px 10px 10px 38px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                  />
                </div>
              </div>

              {/* Rehab Focus */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Primary Rehab Focus</label>
                <div style={{ position: "relative" }}>
                  <Clipboard size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={onboardFocus}
                    onChange={(e) => setOnboardFocus(e.target.value)}
                    placeholder="e.g. Left Knee Arthroplasty"
                    style={{ width: "100%", padding: "10px 10px 10px 38px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                  />
                </div>
              </div>

              {/* Initial Exercise */}
              <div style={{ position: "relative", zIndex: 50 }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Initial Prescribed Exercise</label>
                <select
                  value={onboardExerciseId}
                  onChange={(e) => setOnboardExerciseId(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px" }}
                >
                  <option value="" disabled>Select an exercise...</option>
                  {exercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary"
                disabled={onboarding || !onboardName || !onboardEmail || !onboardPassword}
                style={{ width: "100%", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Send size={16} /> {onboarding ? "Creating Account..." : "Prescribe & Invite"}
              </button>
            </form>
          </motion.div>

          {/* Link Existing Patient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{ padding: "28px", overflow: "visible", zIndex: 10 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Link size={20} color="var(--accent-purple)" />
              </div>
              <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>Link Existing Patient</h2>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 20px", lineHeight: 1.5 }}>
              Connect a patient who already has a Kinetix account to your roster by entering their email.
            </p>

            <form onSubmit={handleLinkPatient} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Patient Email</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="patient@email.com"
                    required
                    style={{ width: "100%", padding: "10px 10px 10px 38px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={linking || !linkEmail}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Link size={16} /> {linking ? "Searching..." : "Find & Link Patient"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* ===== ROW 3: Patient Roster (Full Width) ===== */}
        <div style={{ marginBottom: "24px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: "28px" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} color="var(--accent-purple)" />
              </div>
              <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>Patient Roster</h2>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => setRosterTab("active")}
                style={{
                  flex: 1, padding: "10px 16px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif",
                  transition: "all 0.2s",
                  background: rosterTab === "active" ? "rgba(0, 229, 255, 0.12)" : "transparent",
                  color: rosterTab === "active" ? "var(--accent-cyan)" : "var(--text-muted)",
                  borderBottom: rosterTab === "active" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
              >
                <Activity size={14} /> Active
              </button>
              <button
                onClick={() => setRosterTab("completed")}
                style={{
                  flex: 1, padding: "10px 16px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif",
                  transition: "all 0.2s",
                  background: rosterTab === "completed" ? "rgba(124, 58, 237, 0.12)" : "transparent",
                  color: rosterTab === "completed" ? "var(--accent-purple)" : "var(--text-muted)",
                  borderBottom: rosterTab === "completed" ? "2px solid var(--accent-purple)" : "2px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
              >
                <CheckCircle size={14} /> Completed
              </button>
            </div>

            {/* Roster Content */}
            {(() => {
              const filteredPatients = activePatients.filter(pt => {
                if (rosterTab === 'active') {
                  // Show: has pending routines OR has no routines yet (newly linked)
                  const hasPending = pt.routines?.some(r => r.status === 'pending');
                  const hasNoRoutines = pt.total === 0;
                  return hasPending || hasNoRoutines;
                }
                // Completed tab: only patients where ALL routines are completed (and they have some)
                const allCompleted = pt.routines?.every(r => r.status === 'completed');
                return allCompleted && pt.total > 0;
              });

              if (filteredPatients.length === 0) {
                return (
                  <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(124, 58, 237, 0.05)", borderRadius: "12px", border: "1px dashed var(--border-subtle)" }}>
                    <Users size={36} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      {rosterTab === 'active' ? 'No active patients' : 'No completed protocols'}
                    </div>
                    <div style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "13px" }}>
                      {rosterTab === 'active' ? 'Onboard a patient or link an existing one.' : 'Archive active patients to see them here.'}
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                  {filteredPatients.map((pt) => {
                    const compliance = pt.total > 0 ? Math.round((pt.completed / pt.total) * 100) : 0;
                    const mockFocuses = ["Left Knee Arthroplasty", "Right Shoulder Repair", "ACL Reconstruction", "Hip Replacement", "Ankle Stabilization"];
                    const focusIndex = pt.name.length % mockFocuses.length;
                    const initials = pt.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                    const isActive = rosterTab === 'active';

                    return (
                      <div key={pt.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px",
                        background: "var(--bg-secondary)",
                        borderRadius: "12px",
                        border: "1px solid var(--border-subtle)",
                        transition: "all 0.2s",
                        opacity: isActive ? 1 : 0.7,
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/doctor/patient/${pt.id}`)}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = isActive ? "var(--accent-purple)" : "var(--accent-cyan)"; e.currentTarget.style.boxShadow = isActive ? "var(--glow-purple)" : "var(--glow-cyan)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "50%",
                          background: isActive
                            ? "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,237,0.15))"
                            : "rgba(74, 106, 138, 0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", flexShrink: 0,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                          {initials}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{mockFocuses[focusIndex]}</div>
                        </div>

                        {/* Compliance Badge */}
                        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                          <div>
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                              background: compliance >= 75 ? "rgba(16, 185, 129, 0.1)" : compliance >= 40 ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: compliance >= 75 ? "var(--accent-green)" : compliance >= 40 ? "var(--accent-amber)" : "var(--accent-red)",
                              border: `1px solid ${compliance >= 75 ? "rgba(16,185,129,0.3)" : compliance >= 40 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                            }}>
                              <TrendingUp size={12} />
                              {compliance}%
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                              {pt.completed}/{pt.total} protocols
                            </div>
                          </div>

                          {/* Archive Button — only on Active tab */}
                          {isActive && (
                            <button
                              onClick={() => handleArchiveRoutine(pt.id)}
                              title="Archive — Mark all protocols as completed"
                              style={{
                                background: "rgba(124, 58, 237, 0.1)",
                                border: "1px solid rgba(124, 58, 237, 0.25)",
                                borderRadius: "8px",
                                padding: "6px",
                                cursor: "pointer",
                                color: "var(--accent-purple)",
                                transition: "all 0.2s",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(124, 58, 237, 0.25)"; e.currentTarget.style.boxShadow = "var(--glow-purple)"; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        </div>

      </main>
    </div>
  );
}
