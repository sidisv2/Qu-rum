import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Info, ArrowRight, CheckCircle2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { BusinessInsight } from "../../lib/intelligence/types";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { formatCurrency } from "../../lib/utils/formatters";

interface RequiresAttentionProps {
  insights: BusinessInsight[];
  onActionClick: (insight: BusinessInsight) => void;
  onDismiss: (id: string) => void;
  onNavigateToSection: (section: string) => void;
}

export const RequiresAttention: React.FC<RequiresAttentionProps> = ({
  insights,
  onActionClick,
  onDismiss,
  onNavigateToSection
}) => {
  const [evidenceDrawerInsight, setEvidenceDrawerInsight] = useState<BusinessInsight | null>(null);
  const activeInsights = insights.filter(i => i.status === "pending").slice(0, 4);

  if (activeInsights.length === 0) {
    return (
      <div className="card" style={{ backgroundColor: "var(--color-success-bg)", borderColor: "var(--color-success-border)", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
        <CheckCircle2 size={24} style={{ color: "var(--color-success-text)" }} />
        <div>
          <h4 style={{ fontWeight: 700, color: "var(--color-success-text)", fontSize: "0.9375rem" }}>Todo bajo control</h4>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-success-text)", opacity: 0.9 }}>No se detectan alertas críticas ni desvíos operativos en este momento.</p>
        </div>
      </div>
    );
  }

  const getBadgeConfig = (severity: string, type: string) => {
    if (severity === "critical" || type === "risk") {
      return {
        icon: <AlertCircle size={18} style={{ color: "var(--color-danger-text)" }} />,
        bg: "var(--color-danger-bg)",
        border: "var(--color-danger-border)",
        badgeClass: "badge badge-danger",
        badgeLabel: "Prioridad Crítica"
      };
    }
    if (severity === "high" || type === "opportunity") {
      return {
        icon: <AlertTriangle size={18} style={{ color: "var(--color-warning-text)" }} />,
        bg: "var(--color-warning-bg)",
        border: "var(--color-warning-border)",
        badgeClass: "badge badge-warning",
        badgeLabel: "Oportunidad de Cierre"
      };
    }
    return {
      icon: <Info size={18} style={{ color: "var(--color-info-text)" }} />,
      bg: "var(--color-info-bg)",
      border: "var(--color-info-border)",
      badgeClass: "badge badge-info",
      badgeLabel: "Atención"
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Requiere atención</span>
          <span className="badge badge-danger" style={{ fontSize: "0.75rem" }}>
            {activeInsights.length}
          </span>
        </h2>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          Calculado por Motor de Inteligencia Direx
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {activeInsights.map(ins => {
          const cfg = getBadgeConfig(ins.severity, ins.type);
          return (
            <div
              key={ins.id}
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
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", flex: 1 }}>
                <div style={{ marginTop: "2px" }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                    <span className={cfg.badgeClass} style={{ fontSize: "0.6875rem" }}>
                      {cfg.badgeLabel}
                    </span>
                    <h4 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                      {ins.title}
                    </h4>
                  </div>

                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                    {ins.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Impacto: </span>
                      <span className="tabular-nums" style={{ fontWeight: 800 }}>{ins.impactFormatted}</span>
                    </div>

                    <button
                      onClick={() => setEvidenceDrawerInsight(ins)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-accent)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem"
                      }}
                    >
                      <FileText size={12} />
                      <span>Ver datos utilizados</span>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: "160px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onActionClick(ins)}
                  icon={<ArrowRight size={14} />}
                >
                  {ins.suggestedAction.label}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(ins.id)}
                  style={{ fontSize: "0.75rem", padding: "0.2rem" }}
                >
                  Descartar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer de Evidencia y Datos Utilizados */}
      {evidenceDrawerInsight && (
        <Drawer
          isOpen={true}
          onClose={() => setEvidenceDrawerInsight(null)}
          title={"Evidencia: " + evidenceDrawerInsight.title}
          subtitle="Datos reales que respaldan este insight"
          footer={
            <Button variant="primary" size="sm" onClick={() => setEvidenceDrawerInsight(null)}>
              Cerrar
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                DIAGNÓSTICO EXPLICADO
              </div>
              <p style={{ fontSize: "0.875rem", marginTop: "0.4rem", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                {evidenceDrawerInsight.description}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Métricas y Evidencias Observadas:
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {evidenceDrawerInsight.evidence.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border-default)",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{ev.label}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Origen: {ev.source}</div>
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 800 }} className="tabular-nums">
                      {ev.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-accent-light)", color: "var(--color-accent-text)", fontSize: "0.8125rem" }}>
              <strong>Nivel de Confianza:</strong> {evidenceDrawerInsight.confidence.toUpperCase()} (Basado en registros determinísticos de la empresa).
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
