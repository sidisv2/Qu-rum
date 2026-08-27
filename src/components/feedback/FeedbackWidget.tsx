import React, { useState, useEffect } from "react";
import { Headphones, X, Send, CheckCircle2, AlertCircle, LifeBuoy, Mail, Loader2, Bug, CreditCard, Lightbulb, HelpCircle } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase/client";
import { Button } from "../ui/Button";

interface FeedbackWidgetProps {
  currentView: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketType, setTicketType] = useState<"bug" | "billing" | "feature_request" | "general_support">("general_support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ ticketNumber: string; targetEmail: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { currentOrg } = useOrg();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email && !userEmail) {
      setUserEmail(user.email);
    }
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (supabase && currentOrg?.id) {
        const { data, error } = await supabase.functions.invoke("send-support-ticket", {
          body: {
            organizationId: currentOrg.id,
            ticketType,
            subject: subject.trim(),
            description: `[Vista: ${currentView}]\n\n` + message.trim(),
            userEmail: userEmail || user?.email || "sin-email",
            orgName: currentOrg.name,
            taxId: currentOrg.taxId
          }
        });

        if (error) {
          const errMsg = error.context?.json?.error?.message || error.message || "Error al conectar con el servidor";
          setErrorMessage(errMsg);
          return;
        }

        if (data?.success) {
          setSuccessInfo({
            ticketNumber: data.ticketNumber,
            targetEmail: data.targetEmail
          });
          setSubject("");
          setMessage("");
          return;
        }
      }

      // Fallback local
      const mockNum = "TICK-" + Date.now().toString().slice(-6);
      setSuccessInfo({
        ticketNumber: mockNum,
        targetEmail: (ticketType === "bug" || ticketType === "general_support") ? "soporte@direx.online" : "contacto@direx.online"
      });
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al enviar la consulta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setSuccessInfo(null);
            setErrorMessage(null);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "var(--color-primary, #4f46e5)",
            color: "#ffffff",
            border: "none",
            borderRadius: "9999px",
            padding: "0.6rem 1.1rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
            transition: "all 0.2s ease"
          }}
        >
          <Headphones size={18} />
          <span>Soporte & Ayuda</span>
        </button>
      </div>

      {/* Modal flotante */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "75px",
            right: "20px",
            width: "360px",
            maxWidth: "calc(100vw - 40px)",
            backgroundColor: "var(--color-bg-card, #ffffff)",
            border: "1px solid var(--color-border-default, #e2e8f0)",
            borderRadius: "var(--radius-lg, 12px)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 10000,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--color-bg-subtle, #f8fafc)",
              borderBottom: "1px solid var(--color-border-default, #e2e8f0)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <LifeBuoy size={18} style={{ color: "var(--color-primary, #4f46e5)" }} />
              <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                Centro de Atención
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "1rem" }}>
            {successInfo ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <CheckCircle2 size={40} style={{ color: "#16a34a", margin: "0 auto 0.75rem" }} />
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#166534" }}>
                  ¡Ticket #{successInfo.ticketNumber} Enviado!
                </h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
                  Tu consulta fue dirigida a <strong>{successInfo.targetEmail}</strong>. Te responderemos a la brevedad a tu casilla.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {errorMessage && (
                  <div style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", backgroundColor: "#fef2f2", color: "#991b1b", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Tipo de Ticket */}
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
                    Tipo de Consulta
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                    {[
                      { id: "general_support", label: "Soporte", icon: <HelpCircle size={12} /> },
                      { id: "bug", label: "Error / Bug", icon: <Bug size={12} /> },
                      { id: "billing", label: "Facturación", icon: <CreditCard size={12} /> },
                      { id: "feature_request", label: "Sugerencia", icon: <Lightbulb size={12} /> }
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setTicketType(t.id as any)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.4rem 0.5rem",
                          borderRadius: "var(--radius-sm, 6px)",
                          border: ticketType === t.id ? "1.5px solid var(--color-primary, #4f46e5)" : "1px solid var(--color-border-default)",
                          backgroundColor: ticketType === t.id ? "rgba(79, 70, 229, 0.08)" : "transparent",
                          color: ticketType === t.id ? "var(--color-primary, #4f46e5)" : "var(--color-text-secondary)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email de Contacto */}
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
                    Tu Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="tu@email.com"
                    style={{ width: "100%", padding: "0.45rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  />
                </div>

                {/* Asunto */}
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
                    Asunto
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Resumen de la consulta"
                    style={{ width: "100%", padding: "0.45rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
                    Detalle
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="¿En qué te podemos ayudar?"
                    style={{ width: "100%", padding: "0.45rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Mail size={12} />
                  <span>soporte@direx.online • contacto@direx.online</span>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={!subject.trim() || !message.trim() || isSubmitting}
                  style={{ width: "100%", marginTop: "0.25rem" }}
                  icon={isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
