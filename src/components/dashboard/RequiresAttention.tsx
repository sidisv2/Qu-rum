import React from "react";
import { AlertCircle, AlertTriangle, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import { AIRecommendation } from "../../types";
import { Button } from "../ui/Button";

interface RequiresAttentionProps {
  recommendations: AIRecommendation[];
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigateToSection: (section: string) => void;
}

export const RequiresAttention: React.FC<RequiresAttentionProps> = ({
  recommendations,
  onApply,
  onDismiss
}) => {
  const activeAlerts = recommendations.filter(r => r.status === "pending");

  if (activeAlerts.length === 0) {
    return (
      <div className="card" style={{ backgroundColor: "var(--color-success-bg)", borderColor: "var(--color-success-border)", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
        <CheckCircle2 size={24} style={{ color: "var(--color-success-text)" }} />
        <div>
          <h4 style={{ fontWeight: 700, color: "var(--color-success-text)", fontSize: "0.9375rem" }}>Todo bajo control</h4>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-success-text)", opacity: 0.9 }}>No hay alertas críticas que requieran atención inmediata en este momento.</p>
        </div>
      </div>
    );
  }

  const getAlertConfig = (category: string, impact: string) => {
    if (impact === "high" || category === "risk") {
      return {
        icon: <AlertCircle size={20} style={{ color: "var(--color-danger-text)" }} />,
        bg: "var(--color-danger-bg)",
        border: "var(--color-danger-border)",
        badge: "badge-danger",
        badgeLabel: "Prioridad Alta"
      };
    }
    if (category === "quote" || category === "expense") {
      return {
        icon: <AlertTriangle size={20} style={{ color: "var(--color-warning-text)" }} />,
        bg: "var(--color-warning-bg)",
        border: "var(--color-warning-border)",
        badge: "badge-warning",
        badgeLabel: "Atención"
      };
    }
    return {
      icon: <Info size={20} style={{ color: "var(--color-info-text)" }} />,
      bg: "var(--color-info-bg)",
      border: "var(--color-info-border)",
      badge: "badge-info",
      badgeLabel: "Oportunidad"
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Requiere atención</span>
          <span className="badge badge-danger" style={{ fontSize: "0.75rem" }}>
            {activeAlerts.length}
          </span>
        </h2>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          Detectado automáticamente por Director IA
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {activeAlerts.map(alert => {
          const cfg = getAlertConfig(alert.category, alert.impact);
          return (
            <div
              key={alert.id}
              className="card"
              style={{
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
                padding: "1.1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1.25rem"
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flex: 1 }}>
                <div style={{ marginTop: "2px" }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span className={"badge " + cfg.badge} style={{ fontSize: "0.6875rem" }}>
                      {cfg.badgeLabel}
                    </span>
                    <h4 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                      {alert.title}
                    </h4>
                  </div>

                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                    {alert.explanation}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Recomendación:</span>
                    <span>{alert.recommendation}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: "150px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApply(alert.id)}
                  icon={<ArrowRight size={14} />}
                >
                  Resolver acción
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(alert.id)}
                  style={{ fontSize: "0.75rem", padding: "0.2rem" }}
                >
                  Descartar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
