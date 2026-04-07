import { Link, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, Stethoscope, HeartPulse } from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor", icon: Stethoscope, label: "Doctor View" },
];

export default function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 24px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #00e5ff, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={20} color="#050b18" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                background: "linear-gradient(135deg, #00e5ff, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Kinetix
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              AI REHAB PORTAL
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0d3a55, #1a5276)",
              border: "2px solid var(--border-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--accent-cyan)",
            }}
          >
            AK
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Alex Kumar
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Post-op · Week 4
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 12px", flex: 1 }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              to={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                marginBottom: "4px",
                textDecoration: "none",
                background: active ? "rgba(0, 229, 255, 0.08)" : "transparent",
                border: active ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
                color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                fontWeight: active ? 600 : 400,
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Status indicator */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HeartPulse size={14} color="var(--accent-green)" />
          <span style={{ fontSize: "12px", color: "var(--accent-green)" }}>System Active</span>
        </div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
          Session · {new Date().toLocaleDateString()}
        </div>
      </div>
    </aside>
  );
}
