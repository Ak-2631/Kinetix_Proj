import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Mail, Zap } from "lucide-react";

export default function Login() {
  const { role } = useParams(); // 'patient' or 'doctor'
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
             await supabase.from('profiles').upsert({
               id: signUpData.user.id,
               role: role,
               full_name: role === 'doctor' ? 'Dr. Demo Clinician' : 'Alex Kumar (Demo)'
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
        style={{ padding: "40px", width: "100%", maxWidth: "400px" }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px", fontFamily: "'Space Grotesk', sans-serif" }}>
            {role === 'doctor' ? 'Clinician' : 'Patient'} Login
          </h2>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Sign in to access your Kinetix dashboard</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--accent-red)", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center" }}>
            {error}
          </div>
        )}

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
      </motion.div>
    </div>
  );
}
