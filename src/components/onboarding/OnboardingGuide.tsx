import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Building,
  UploadCloud,
  Bot,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";
import { NavSection } from "../layout/Sidebar";

interface OnboardingGuideProps {
  onNavigateToSection?: (section: NavSection) => void;
  salesCount: number;
  expensesCount: number;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  onNavigateToSection,
  salesCount,
  expensesCount
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("direx_onboarding_guide_dismissed") === "true";
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const totalOps = salesCount + expensesCount;
  if (isDismissed || totalOps >= 3) return null;

  const handleDismiss = () => {
    localStorage.setItem("direx_onboarding_guide_dismissed", "true");
    setIsDismissed(true);
  };

  const steps = [
    {
      id: "company",
      title: "1. Identificación y Parámetros de la Empresa",
      desc: "Revisá la razón social, CUIT y moneda operativa de tu empresa.",
      actionLabel: "Configurar Empresa",
      targetSection: "settings" as NavSection,
      icon: <Building size={16} />,
      isCompleted: true
    },
    {
      id: "operations",
      title: "2. Cargar o Importar Movimientos",
      desc: "Subí tus comprobantes históricos por CSV o registrá tus primeras ventas y gastos.",
      actionLabel: "Importar CSV / Cargar Ventas",
      targetSection: "import-csv" as NavSection,
      icon: <UploadCloud size={16} />,
      isCompleted: totalOps > 0
    },
    {
      id: "director-ia",
      title: "3. Auditoría con Director IA",
      desc: "Consultá tu diagnóstico ejecutivo, margen operativo y proyecciones de caja.",
      actionLabel: "Consultar Director IA",
      targetSection: "director-ia" as NavSection,
      icon: <Bot size={16} />,
      isCompleted: false
    }
  ];

  return (
    <div
      className="card"
      style={{
        border: "1.5px solid #818cf8",
        backgroundColor: "rgba(79, 70, 229, 0.03)",
        boxShadow: "0 4px 20px rgba(79, 70, 229, 0.08)",
        borderRadius: "var(--radius-lg, 12px)",
        padding: "1.25rem",
        marginBottom: "1.5rem"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(79, 70, 229, 0.12)",
              color: "#4f46e5"
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
              Primeros Pasos para tu Empresa
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
              Completá estos 3 pasos para activar el análisis predictivo y el control de cobros.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.3rem" }}
            title={isCollapsed ? "Expandir" : "Minimizar"}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button
            onClick={handleDismiss}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.3rem" }}
            title="Ocultar guía"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "0.85rem",
                borderRadius: "var(--radius-md, 8px)",
                backgroundColor: "var(--color-bg-card, #ffffff)",
                border: "1px solid var(--color-border-default, #e2e8f0)"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {step.title}
                  </span>
                  {step.isCompleted ? (
                    <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
                  ) : (
                    <Circle size={16} style={{ color: "var(--color-text-muted)" }} />
                  )}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>
                  {step.desc}
                </p>
              </div>

              <button
                onClick={() => onNavigateToSection && onNavigateToSection(step.targetSection)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.6rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#4f46e5",
                  backgroundColor: "rgba(79, 70, 229, 0.06)",
                  border: "none",
                  borderRadius: "var(--radius-sm, 6px)",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                <span>{step.actionLabel}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
