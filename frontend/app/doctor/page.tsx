"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { FileText, Cpu, User, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface PatientData {
  summary: string;
  generatedAt: string;
  model: string;
  patient: string;
  rawData: any;
}

export default function DoctorDashboard() {
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch("/api/summary");
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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
        </header>

        {loading ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--text-muted)" }}>
            <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid rgba(0,229,255,0.2)", borderTopColor: "var(--accent-cyan)", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
            Analyzing patient data...
          </div>
        ) : error ? (
          <div style={{ padding: "20px", background: "rgba(239,68,68,0.1)", color: "var(--accent-red)", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)" }}>
            Error: {error}
          </div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: "32px", maxWidth: "800px" }}
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
                  {data.rawData?.painLevels?.length > 0 ? (data.rawData.painLevels.reduce((a: number, b: number) => a + b, 0) / data.rawData.painLevels.length).toFixed(1) : "N/A"}
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
      </main>
    </div>
  );
}
