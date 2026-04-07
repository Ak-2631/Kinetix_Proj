import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function ProtectedRoute({ allowedRole }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleAssigned, setRoleAssigned] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && profile) {
      setRoleAssigned(profile.role);
    } else {
      // In case profile creation lagged slightly behind sign-up in Demo Mode
      console.warn("Could not find user profile or role", error);
      // Fallback: If no profile found, maybe allow demo to proceed if role fits endpoint (Not ideal for prod, but good for hackathon demos)
      setRoleAssigned(allowedRole);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(0,229,255,0.2)", borderTopColor: "var(--accent-cyan)", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && roleAssigned && roleAssigned !== allowedRole) {
    // If patient tries to load doctor route, redirect them to patient etc.
    return <Navigate to={`/${roleAssigned}`} replace />;
  }

  return <Outlet />;
}
