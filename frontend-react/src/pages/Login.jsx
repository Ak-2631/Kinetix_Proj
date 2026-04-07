import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Mail, Zap, UserPlus, User } from "lucide-react";

export default function Login() {
  const { role } = useParams(); // 'patient' or 'doctor'
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registration mode state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerName, setRegisterName] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate(role === 'doctor' ? '/doctor' : '/patient');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create the auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const newUserId = signUpData?.user?.id;
      if (!newUserId) {
        setError("Registration succeeded but could not retrieve user ID.");
        setLoading(false);
        return;
      }

      // Step 2: Insert into corresponding table directly (doctors or patients)
      const targetTable = role === 'doctor' ? 'doctors' : 'patients';
      const insertPayload = { id: newUserId, full_name: registerName, email };
      
      // Keep rehab_focus mapping if we add it to the UI later for patients.
      const { error: profileError } = await supabase.from(targetTable).insert(insertPayload);

      if (profileError) {
        console.warn(`${targetTable} insert warning:`, profileError.message);
      }

      // Step 3: Route to correct dashboard
      navigate(role === 'doctor' ? '/doctor' : '/patient');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    
    // For a hackathon demo, we log in with known demo credentials.
    // Ensure these accounts exist in your Supabase project!
    const demoEmail = role === 'doctor' ? 'doctor@kinetix.com' : 'patient@kinetix.com';
    const demoPassword = 'password123';
    
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
         // Auto sign up the demo user if they don't exist for a truly seamless demo
         const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
           email: demoEmail,
           password: demoPassword,
         });
         
         if (signUpError) {
             setError("Demo setup failed. Please check Supabase logs: " + signUpError.message);
             setLoading(false);
             return;
         }

         // Wait a moment, then create profile manually if needed, or trigger might handle it.
         // Let's insert the profile manually just in case
         if (signUpData?.user) {
             const targetTable = role === 'doctor' ? 'doctors' : 'patients';
             await supabase.from(targetTable).upsert({
               id: signUpData.user.id,
               full_name: role === 'doctor' ? 'Dr. Demo Clinician' : 'Alex Kumar (Demo)',
               email: demoEmail
             });
         }
         
         navigate(role === 'doctor' ? '/doctor' : '/patient');
         return;
      }
      
      setError(error.message);
      setLoading(false);
      return;
    }
    
    navigate(role === 'doctor' ? '/doctor' : '/patient');
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <button 
        onClick={() => navigate('/')}
        style={{ position: 'absolute', top: '30px', left: '30px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
        style={{ padding: "40px", width: "100%", maxWidth: "420px" }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px", fontFamily: "'Space Grotesk', sans-serif" }}>
            {isRegisterMode 
              ? `${role === 'doctor' ? 'Clinician' : 'Patient'} Registration` 
              : `${role === 'doctor' ? 'Clinician' : 'Patient'} Login`
            }
          </h2>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            {isRegisterMode 
              ? `Create your Kinetix account` 
              : 'Sign in to access your Kinetix dashboard'
            }
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--accent-red)", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* ===== REGISTRATION FORM ===== */}
        {isRegisterMode ? (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  style={{ width: "100%", padding: "10px 10px 10px 40px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                  placeholder={role === 'doctor' ? "Dr. Jane Smith" : "Alex Kumar"}
                  required
                  onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 10px 10px 40px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                  placeholder="you@clinic.com"
                  required
                  onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Password</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 10px 10px 40px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent-cyan)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: "100%", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              disabled={loading}
            >
              <UserPlus size={18} /> {loading ? "Creating Account..." : "Register & Enter"}
            </button>
          </form>
        ) : (
          /* ===== LOGIN FORM ===== */
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 10px 10px 40px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>Password</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 10px 10px 40px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: "100%", marginTop: "8px" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Toggle: Register as User/Clinician */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(!isRegisterMode); setError(null); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-cyan)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: "6px",
              transition: "all 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0, 229, 255, 0.08)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "none"; }}
          >
            {isRegisterMode ? (
              <><ArrowLeft size={14} /> Back to Sign In</>
            ) : (
              <><UserPlus size={14} /> {role === 'doctor' ? 'Register as a Clinician' : 'Register as a Patient'}</>
            )}
          </button>
        </div>

        {/* Divider + Demo Login (only in login mode) */}
        {!isRegisterMode && (
          <>
            <div style={{ display: "flex", alignItems: "center", margin: "24px 0", color: "var(--text-muted)" }}>
              <div style={{ flex: 1, borderBottom: "1px solid var(--border-subtle)" }}></div>
              <span style={{ padding: "0 10px", fontSize: "14px" }}>OR</span>
              <div style={{ flex: 1, borderBottom: "1px solid var(--border-subtle)" }}></div>
            </div>

            <button 
              onClick={handleDemoLogin}
              type="button"
              style={{ width: "100%", padding: "10px", background: "rgba(124, 58, 237, 0.1)", border: "1px solid var(--accent-purple)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
              disabled={loading}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(124, 58, 237, 0.2)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"; }}
            >
              <Zap size={18} color="var(--accent-cyan)" /> {loading ? "Loading..." : `Demo ${role === 'doctor' ? 'Clinician' : 'Patient'} Login`}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
