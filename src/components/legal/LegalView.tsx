import React, { useState } from "react";
import { ShieldCheck, FileText, Lock, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";

interface LegalViewProps {
  initialTab?: "terms" | "privacy";
  onBack?: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ initialTab = "terms", onBack }) => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={26} style={{ color: "var(--color-primary, #4f46e5)" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
              Marco Legal y Privacidad
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Condiciones de servicio, protección de datos y seguridad empresarial en Direx.
          </p>
        </div>

        {onBack && (
          <Button variant="outline" size="sm" icon={<ArrowLeft size={14} />} onClick={onBack}>
            Volver
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border-default)" }}>
        <button
          onClick={() => setActiveTab("terms")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.75rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            color: activeTab === "terms" ? "var(--color-primary, #4f46e5)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "terms" ? "2px solid var(--color-primary, #4f46e5)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer"
          }}
        >
          <FileText size={16} />
          Términos y Condiciones
        </button>

        <button
          onClick={() => setActiveTab("privacy")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.75rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            color: activeTab === "privacy" ? "var(--color-primary, #4f46e5)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "privacy" ? "2px solid var(--color-primary, #4f46e5)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer"
          }}
        >
          <Lock size={16} />
          Política de Privacidad
        </button>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: "1.75rem", lineHeight: 1.6, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>
        {activeTab === "terms" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Términos del Servicio (Direx)</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Última actualización: 27 de agosto de 2026</p>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>1. Objeto del Servicio</h3>
              <p>
                Direx es una plataforma SaaS (Software como Servicio) de inteligencia financiera, automatización de cobranzas y gestión de operaciones diseñada para pequeñas y medianas empresas. La plataforma permite la centralización de ventas, gastos, cuentas corrientes e integración con modelos analíticos.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>2. Alcance del Director IA</h3>
              <p>
                El <strong>Director IA</strong> es una herramienta de asistencia ejecutiva orientada a la sintetización y diagnóstico de datos operativos. <strong>No constituye asesoramiento contable, fiscal, impositivo ni legal vinculante</strong>. Los análisis y proyecciones provistos son diagnósticos de apoyo que deben ser contrastados con profesionales matriculados antes de la toma de decisiones tributarias o estatutarias.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>3. Planes, Facturación y Cancelación</h3>
              <p>
                Los planes de suscripción (Starter, Plan Fundador, Pro) se procesan de forma recurrente y segura a través de <strong>Mercado Pago</strong>. El usuario puede modificar o cancelar su suscripción en cualquier momento desde su panel de control. El acceso continuará activo hasta la finalización del ciclo mensual vigente.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>4. Canales Oficiales de Atención</h3>
              <p>
                Para soporte técnico o reclamos operativos: <strong>soporte@direx.online</strong>.<br />
                Para consultas comerciales y facturación: <strong>contacto@direx.online</strong>.
              </p>
            </section>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Política de Privacidad y Protección de Datos</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Última actualización: 27 de agosto de 2026</p>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>1. Aislamiento Criptográfico y Multi-Tenant</h3>
              <p>
                La información financiera, clientes, facturación y registros de cada empresa se encuentran estrictamente aislados mediante políticas de <strong>Row-Level Security (RLS)</strong> a nivel de base de datos PostgreSQL. Ninguna organización tiene visibilidad ni acceso a los comprobantes de otra.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>2. No Comercialización de Datos</h3>
              <p>
                Direx <strong>no comercializa, arrienda ni transfiere bases de datos de clientes o métricas comerciales</strong> a terceros bajo ninguna circunstancia. Toda información cargada por los usuarios es propiedad exclusiva de su respectiva empresa titular.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>3. Seguridad en el Procesamiento de Pagos</h3>
              <p>
                Las transacciones bancarias y datos de tarjetas son gestionados directamente por pasarelas certificadas (Mercado Pago). Direx no almacena números de tarjeta ni datos sensibles de pago en sus servidores locales.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>4. Ejercicio de Derechos ARCO</h3>
              <p>
                Los usuarios titulares pueden solicitar la rectificación, exportación o eliminación definitiva de sus datos y registros enviando una solicitud formal a <strong>soporte@direx.online</strong>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
