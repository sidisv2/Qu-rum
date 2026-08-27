import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChatStorageService } from "../../lib/intelligence/chatStorage";
import { useAuth } from "../../context/AuthContext";
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Building2,
  FileText,
  Trash2
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { DirectorAIService } from "../../lib/intelligence/directorAIService";
import { BusinessInsight } from "../../lib/intelligence/types";
import { PlanLimitsService } from "../../lib/subscription/planLimits";
import { supabase } from "../../lib/supabase/client";
import { ExternalLink, Clock, ArrowRight, ShieldAlert } from "lucide-react";

export const DirectorIAView: React.FC = () => {
  const {
    sales,
    expenses,
    receivables,
    payables,
    quotes,
    customers,
    products,
    currentOrg
  } = useOrg();

  const { user } = useAuth();
  const [currentPlanId, setCurrentPlanId] = useState<string>("founder");
  const [subStatus, setSubStatus] = useState<string>("trialing");
  const userName = user?.fullName?.split(" ")[0] || "Director";
  const defaultWelcome = "Hola " + userName + ". Analicé las finanzas y operaciones de " + (currentOrg?.name || "tu empresa") + " y preparé el diagnóstico de situación para hoy.";

  const [messages, setMessages] = useState<Array<{ id?: string; sender: "user" | "ia"; text: string; structuredInsights?: BusinessInsight[] }>>([
    {
      sender: "ia",
      text: defaultWelcome
    }
  ]);

  useEffect(() => {
    if (!currentOrg?.id || !supabase) return;
    async function loadOrgSubscription() {
      try {
        if (!supabase) return;
        const { data: subData } = await supabase
          .from("organization_subscriptions")
          .select("plan_id, status")
          .eq("organization_id", currentOrg?.id || "")
          .maybeSingle();

        if (subData) {
          setCurrentPlanId(subData.plan_id || "founder");
          setSubStatus(subData.status || "trialing");
        }
      } catch (_e) {}
    }
    loadOrgSubscription();
  }, [currentOrg?.id]);

  // Contar consultas enviadas por el usuario
  const userQueriesCount = useMemo(() => {
    return messages.filter(m => m.sender === "user").length;
  }, [messages]);

  const quotaCheck = useMemo(() => {
    return PlanLimitsService.canQueryAI(userQueriesCount, currentPlanId, subStatus, currentOrg?.createdAt);
  }, [userQueriesCount, currentPlanId, subStatus, currentOrg?.createdAt]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [evidenceInsight, setEvidenceInsight] = useState<BusinessInsight | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar historial persistido al montar o cambiar de organización
  useEffect(() => {
    if (!currentOrg?.id) return;
    let isMounted = true;
    ChatStorageService.loadMessages(currentOrg.id, defaultWelcome).then((saved) => {
      if (isMounted && saved.length > 0) {
        setMessages(saved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentOrg?.id]);

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleClearHistory = async () => {
    if (!currentOrg?.id) return;
    await ChatStorageService.clearHistory(currentOrg.id, user?.id);
    setMessages([{ sender: "ia", text: defaultWelcome }]);
  };

  // Consulta analítica estructurada
  const analytics = useMemo(() => {
    return DirectorAIService.getAnalytics({
      organizationId: currentOrg?.id || "org-1",
      customers,
      products,
      sales,
      expenses,
      receivables,
      payables,
      quotes
    });
  }, [currentOrg, customers, products, sales, expenses, receivables, payables, quotes]);

  const { receivablesMetrics, customersMetrics, quotesMetrics, insights } = analytics;

  const quickQuestions = [
    "¿Cómo está mi negocio hoy?",
    "¿Qué debería hacer hoy?",
    "¿Quién me debe dinero y cuánto?",
    "¿Qué clientes están en riesgo?",
    "¿Qué gastos aumentaron este mes?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputText;
    if (!q.trim() || isLoading) return;

    if (!quotaCheck.allowed) {
      const blockMsg = quotaCheck.reason || "Alcanzaste el límite de consultas de tu plan actual. Mejorá a un plan superior para continuar.";
      setMessages(prev => [
        ...prev,
        { sender: "user", text: q },
        { sender: "ia", text: blockMsg }
      ]);
      setInputText("");
      return;
    }

    setMessages(prev => [...prev, { sender: "user", text: q }]);
    setInputText("");
    setIsLoading(true);

    // Persistir mensaje del usuario
    if (currentOrg?.id) {
      await ChatStorageService.saveMessage(currentOrg.id, user?.id, "user", q);
    }

    try {
      const response = await DirectorAIService.answerExecutiveQuery({
        question: q,
        orgData: {
          organizationId: currentOrg?.id || "org-1",
          customers,
          products,
          sales,
          expenses,
          receivables,
          payables,
          quotes
        },
        organizationName: currentOrg?.name || "Empresa"
      });

      setMessages(prev => [...prev, {
        sender: "ia",
        text: response.answer,
        structuredInsights: response.structuredInsights
      }]);

      // Persistir respuesta del asistente
      if (currentOrg?.id) {
        await ChatStorageService.saveMessage(currentOrg.id, user?.id, "ia", response.answer);
      }
    } catch (e) {
      const errMsg = "Ocurrió un inconveniente al procesar la consulta. Por favor reintentá en unos momentos.";
      setMessages(prev => [...prev, {
        sender: "ia",
        text: errMsg
      }]);
      if (currentOrg?.id) {
        await ChatStorageService.saveMessage(currentOrg.id, user?.id, "ia", errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* 1. Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bot size={24} style={{ color: "var(--color-accent)" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              Director Administrativo IA
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            Diagnóstico ejecutivo, detección de riesgos financieros y recomendaciones para <strong>{currentOrg?.name}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={handleClearHistory}
            style={{
              background: "none",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              padding: "0.35rem 0.65rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
            title="Vaciar historial del chat"
          >
            <Trash2 size={13} />
            <span>Limpiar conversación</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "var(--color-success-bg)", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-full)", border: "1px solid var(--color-success-border)" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--color-success)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-success-text)" }}>
              Motor Determinístico Activo
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tarjetas de Diagnóstico de Situación */}
      <div className="grid grid-cols-3 md-grid-cols-1" style={{ gap: "1rem" }}>
        {/* Problemas / Mora */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <AlertTriangle size={16} style={{ color: "var(--color-danger-text)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-danger-text)" }}>
              {receivablesMetrics.overdueCount} PROBLEMAS DETECTADOS
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }} className="tabular-nums">
            {formatCurrency(receivablesMetrics.totalOverdue)}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            En mora activa. Promedio de atraso: {receivablesMetrics.averageOverdueDays} días.
          </p>
        </div>

        {/* Riesgos de Clientes */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-warning)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Building2 size={16} style={{ color: "var(--color-warning-text)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-warning-text)" }}>
              {customersMetrics.atRiskCount} CLIENTES EN RIESGO
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Inactividad prolongada
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Superaron su intervalo habitual de recompra.
          </p>
        </div>

        {/* Oportunidades de Cierre */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Lightbulb size={16} style={{ color: "var(--color-success-text)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-success-text)" }}>
              OPORTUNIDADES DE VENTA
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-success-text)" }} className="tabular-nums">
            {formatCurrency(quotesMetrics.activeQuotesTotal)}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            En {quotesMetrics.totalQuotes} presupuestos enviados.
          </p>
        </div>
      </div>

      {/* 3. Preguntas Rápidas */}
      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
          Preguntas Ejecutivas al Director IA:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-full)",
                padding: "0.4rem 0.85rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.15s ease"
              }}
            >
              <Sparkles size={13} style={{ color: "var(--color-accent)" }} />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat y Respuestas Estructuradas con Evidencia */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", minHeight: "350px", backgroundColor: "#ffffff" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, overflowY: "auto" }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                gap: "0.25rem"
              }}
            >
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase"
                }}
              >
                {m.sender === "user" ? "Vos" : "Director Administrativo IA"}
              </div>

              <div
                style={{
                  maxWidth: "88%",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: m.sender === "user"
                    ? "var(--color-primary)"
                    : m.text.includes("Alcanzaste el límite") || m.text.includes("período de prueba de 7 días ha finalizado")
                    ? "#fef2f2"
                    : "var(--color-bg-base)",
                  color: m.sender === "user"
                    ? "#ffffff"
                    : m.text.includes("Alcanzaste el límite") || m.text.includes("período de prueba de 7 días ha finalizado")
                    ? "#991b1b"
                    : "var(--color-text-primary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  border: m.sender === "user"
                    ? "none"
                    : m.text.includes("Alcanzaste el límite") || m.text.includes("período de prueba de 7 días ha finalizado")
                    ? "1.5px solid #fecaca"
                    : "1px solid var(--color-border-subtle)",
                  boxShadow: (m.text.includes("Alcanzaste el límite") || m.text.includes("período de prueba de 7 días ha finalizado"))
                    ? "0 4px 12px rgba(220, 38, 38, 0.08)"
                    : "none"
                }}
              >
                {m.text}

                {/* CTA Interactivo de Upgrade si es mensaje de límite */}
                {(m.text.includes("Alcanzaste el límite") || m.text.includes("período de prueba de 7 días ha finalizado")) && (
                  <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid #fee2e2" }}>
                    <a
                      href="/configuracion/mi-plan"
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, "", "/configuracion/mi-plan");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.5rem 0.85rem",
                        borderRadius: "var(--radius-md, 8px)",
                        backgroundColor: "#4f46e5",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)"
                      }}
                    >
                      <span>Elegir un Plan y Desbloquear Acceso Ilimitado</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                )}

                {m.structuredInsights && m.structuredInsights.length > 0 && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-default)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                      Insights Determinísticos Respaldados:
                    </div>
                    {m.structuredInsights.map((ins, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ffffff", padding: "0.4rem 0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-default)", fontSize: "0.75rem" }}>
                        <span style={{ fontWeight: 600 }}>{ins.title}</span>
                        <button
                          onClick={() => setEvidenceInsight(ins)}
                          style={{ background: "none", border: "none", color: "var(--color-accent)", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                        >
                          <FileText size={11} /> Ver datos
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.8125rem", padding: "0.5rem" }}>
              <div className="skeleton" style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
              Consultando motor analítico de {currentOrg?.name}...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "0.75rem" }}>
          <input
            type="text"
            placeholder="Preguntale al Director IA sobre tus números, deudas o rentabilidad..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "0.6rem 0.85rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-default)",
              outline: "none"
            }}
          />
          <Button
            variant="primary"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            icon={<Send size={15} />}
          >
            Preguntar
          </Button>
        </div>
      </div>

      {/* Drawer de Evidencia de Director IA */}
      {evidenceInsight && (
        <Drawer
          isOpen={true}
          onClose={() => setEvidenceInsight(null)}
          title={"Evidencia: " + evidenceInsight.title}
          subtitle="Datos reales que respaldan este insight"
          footer={
            <Button variant="primary" size="sm" onClick={() => setEvidenceInsight(null)}>
              Cerrar
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                DESCRIPCIÓN TÉCNICA
              </div>
              <p style={{ fontSize: "0.875rem", marginTop: "0.4rem", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                {evidenceInsight.description}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Datos y Métricas Observadas:
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {evidenceInsight.evidence.map((ev, i) => (
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
          </div>
        </Drawer>
      )}
    </div>
  );
};
