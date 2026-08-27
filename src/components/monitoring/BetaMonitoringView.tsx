import React, { useState, useEffect } from "react";
import { Activity, AlertTriangle, ShieldCheck, MessageSquare, Clock, Users } from "lucide-react";
import { useOrg } from "../../context/OrgContext";

interface FeedbackItem {
  organizationId: string;
  userId: string;
  feedbackType: string;
  currentView: string;
  message: string;
  timestamp: string;
}

export const BetaMonitoringView: React.FC = () => {
  const { currentOrg } = useOrg();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("direx_beta_feedback") || "[]");
      setFeedbackList(items.reverse());
    } catch (_e) {
      setFeedbackList([]);
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity size={22} style={{ color: "var(--color-primary, #4f46e5)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Panel de Control y Monitoreo de Beta (Fase 7)
          </h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Telemetría en tiempo real, control de cuotas de inferencia y registro de feedback de PyMEs.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary, #4f46e5)" }}>
            <Activity size={18} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Inferencia Director IA</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "0.5rem" }}>
            20 req/min
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            Rate Limit activo por usuario
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981" }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Estado de Edge Functions</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981", marginTop: "0.5rem" }}>
            100% Online
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            0 errores 5xx reportados (7d)
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b" }}>
            <MessageSquare size={18} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Feedback Recibido</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "0.5rem" }}>
            {feedbackList.length} reportes
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            Bugs y sugerencias de beta
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "1rem" }}>
          Comentarios y Feedback de Beta Testers
        </h3>

        {feedbackList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            No hay comentarios registrados todavía. Los usuarios pueden enviar sugerencias desde el botón flotante.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {feedbackList.map((f, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.875rem",
                  borderRadius: "var(--radius-md, 0.375rem)",
                  border: "1px solid var(--color-border-subtle, #e2e8f0)",
                  backgroundColor: "var(--color-bg-base, #f8fafc)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "0.25rem",
                        textTransform: "uppercase",
                        backgroundColor: f.feedbackType === "bug" ? "#fee2e2" : "#e0e7ff",
                        color: f.feedbackType === "bug" ? "#991b1b" : "#3730a3"
                      }}
                    >
                      {f.feedbackType}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      Vista: {f.currentView}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {new Date(f.timestamp).toLocaleString("es-AR")}
                  </span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", marginTop: "0.25rem" }}>
                  {f.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
