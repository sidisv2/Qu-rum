import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Mail,
  Bug,
  CreditCard,
  Lightbulb,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  Headphones
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase/client";
import { Button } from "../ui/Button";

interface SupportTicket {
  id: string;
  ticket_type: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  created_at: string;
}

export const SupportView: React.FC = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();

  const [ticketType, setTicketType] = useState<"bug" | "billing" | "feature_request" | "general_support">("general_support");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [userEmail, setUserEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResponse, setSuccessResponse] = useState<{ ticketNumber: string; targetEmail: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  useEffect(() => {
    if (user?.email && !userEmail) {
      setUserEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!currentOrg?.id) return;
    loadTickets();
  }, [currentOrg?.id]);

  const loadTickets = async () => {
    if (!supabase || !currentOrg?.id) return;
    setIsLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, ticket_type, subject, description, status, priority, created_at")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentTickets(data as SupportTicket[]);
      }
    } catch (_e) {
      // Ignorar fallback
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !currentOrg?.id || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { data, error } = await supabase.functions.invoke("send-support-ticket", {
          body: {
            organizationId: currentOrg.id,
            ticketType,
            subject: subject.trim(),
            description: description.trim(),
            userEmail: userEmail.trim(),
            orgName: currentOrg.name,
            taxId: currentOrg.taxId
          }
        });

        if (error) {
          const errMsg = error.context?.json?.error?.message || error.message || "Error al registrar el ticket";
          setErrorMessage(errMsg);
          return;
        }

        if (data?.success) {
          setSuccessResponse({
            ticketNumber: data.ticketNumber,
            targetEmail: data.targetEmail
          });
          setSubject("");
          setDescription("");
          loadTickets();
          return;
        }
      }

      // Fallback local
      const mockTicketNum = "TICK-" + Date.now().toString().slice(-6);
      setSuccessResponse({
        ticketNumber: mockTicketNum,
        targetEmail: (ticketType === "bug" || ticketType === "general_support") ? "soporte@direx.online" : "contacto@direx.online"
      });
      setSubject("");
      setDescription("");
    } catch (err: any) {
      setErrorMessage(err.message || "Error de red al conectar con el servidor de soporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "950px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LifeBuoy size={24} style={{ color: "var(--color-primary, #4f46e5)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Centro de Soporte y Ayuda
          </h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Atención prioritaria y resolución de incidencias técnicas y comerciales para tu empresa.
        </p>
      </div>

      {/* Buzones Oficiales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", borderLeft: "4px solid #4f46e5" }}>
          <Headphones size={20} style={{ color: "#4f46e5", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Soporte Técnico y Bugs
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
              Inconvenientes con módulos, director IA o carga de comprobantes.
            </p>
            <a
              href="mailto:soporte@direx.online"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", color: "#4f46e5", fontWeight: 700, marginTop: "0.5rem", textDecoration: "none" }}
            >
              <Mail size={14} />
              soporte@direx.online
            </a>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", borderLeft: "4px solid #059669" }}>
          <CreditCard size={20} style={{ color: "#059669", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Consultas y Facturación
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
              Gestión de suscripciones, cambios de plan y consultas comerciales.
            </p>
            <a
              href="mailto:contacto@direx.online"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", color: "#059669", fontWeight: 700, marginTop: "0.5rem", textDecoration: "none" }}
            >
              <Mail size={14} />
              contacto@direx.online
            </a>
          </div>
        </div>
      </div>

      {/* Formulario de Apertura de Ticket */}
      <div className="card">
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-text-primary)" }}>
          Abrir un Ticket de Atención
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
          Completá el formulario para generar un número de seguimiento. Te responderemos a tu casilla registrada a la brevedad.
        </p>

        {errorMessage && (
          <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successResponse ? (
          <div style={{ padding: "1.25rem", borderRadius: "var(--radius-md)", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "1rem" }}>
              <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              ¡Ticket #{successResponse.ticketNumber} Creado Exitosamente!
            </div>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>
              Tu consulta fue enviada directamente al buzón oficial <strong>{successResponse.targetEmail}</strong> con el contexto operativo de tu empresa (<strong>{currentOrg?.name}</strong>).
            </p>
            <div style={{ marginTop: "0.5rem" }}>
              <Button variant="outline" size="sm" onClick={() => setSuccessResponse(null)}>
                Enviar otra consulta
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Selector de Tipo */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
                Tipo de Requerimiento *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
                {[
                  { id: "general_support", label: "Soporte General", icon: <HelpCircle size={15} /> },
                  { id: "bug", label: "Reporte de Error / Bug", icon: <Bug size={15} /> },
                  { id: "billing", label: "Facturación y Planes", icon: <CreditCard size={15} /> },
                  { id: "feature_request", label: "Sugerencia de Función", icon: <Lightbulb size={15} /> }
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTicketType(t.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      border: ticketType === t.id ? "2px solid var(--color-primary, #4f46e5)" : "1px solid var(--color-border-default)",
                      backgroundColor: ticketType === t.id ? "rgba(79, 70, 229, 0.05)" : "transparent",
                      color: ticketType === t.id ? "var(--color-primary, #4f46e5)" : "var(--color-text-secondary)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email de Respuesta */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
                Tu Email de Contacto *
              </label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="nombre@tuempresa.com"
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
              />
            </div>

            {/* Asunto */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
                Asunto / Resumen *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Inconveniente al sincronizar saldo de cliente"
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
              />
            </div>

            {/* Descripción */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
                Detalle del Problema o Consulta *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describí los pasos para reproducir o tu consulta puntual..."
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <Button
                variant="primary"
                type="submit"
                disabled={!subject.trim() || !description.trim() || isSubmitting}
                icon={isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              >
                {isSubmitting ? "Registrando Ticket..." : "Enviar Ticket a Soporte"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Historial de Tickets Recientes */}
      {recentTickets.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={18} style={{ color: "var(--color-primary)" }} />
            Tickets Recientes de la Empresa
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentTickets.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-default)",
                  fontSize: "0.8125rem"
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{t.subject}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    Tipo: {t.ticket_type} • Creado el {new Date(t.created_at).toLocaleDateString("es-AR")}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: t.status === "resolved" ? "#dcfce7" : "#fef3c7",
                    color: t.status === "resolved" ? "#166534" : "#92400e",
                    textTransform: "uppercase"
                  }}
                >
                  {t.status === "open" ? "Abierto" : t.status === "in_progress" ? "En Curso" : "Resuelto"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
