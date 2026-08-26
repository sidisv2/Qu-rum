import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Building2
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { AIService } from "../../lib/ai/aiService";
import { useToast } from "../ui/Toast";

export const DirectorIAView: React.FC = () => {
  const {
    sales,
    expenses,
    receivables,
    payables,
    quotes,
    customers,
    products,
    currentOrg,
    applyAIRecommendation
  } = useOrg();

  const { showToast } = useToast();
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ia"; text: string; structuredData?: any }>>([
    {
      sender: "ia",
      text: "Hola Valentín. Analicé los datos de " + (currentOrg?.name || "tu empresa") + " y preparé el diagnóstico de situación para hoy."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalSales = sales.reduce((acc, s) => acc + (s.status !== "cancelled" ? s.total : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const overdueTotal = receivables.filter(r => r.status === "overdue").reduce((acc, r) => acc + r.balance, 0);
  const overdueCount = receivables.filter(r => r.status === "overdue").length;
  const atRiskCount = customers.filter(c => c.status === "at_risk").length;
  const activeQuotesTotal = quotes.filter(q => q.status === "sent").reduce((acc, q) => acc + q.total, 0);

  const quickQuestions = [
    "¿Cómo está mi negocio hoy?",
    "¿Quién me debe dinero y cuánto?",
    "¿Qué clientes están en riesgo de pérdida?",
    "¿Qué gastos aumentaron este mes?",
    "¿Qué debería hacer hoy?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputText;
    if (!q.trim() || isLoading) return;

    setMessages(prev => [...prev, { sender: "user", text: q }]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await AIService.askDirector({
        question: q,
        orgData: { sales, expenses, receivables, payables, quotes, customers, products },
        organizationName: currentOrg?.name || "Empresa"
      });

      setMessages(prev => [...prev, {
        sender: "ia",
        text: response.answer,
        structuredData: response.structuredSummary
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: "ia",
        text: "Ocurrió un inconveniente al procesar la consulta. Por favor reintentá en unos momentos."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* 1. Header del Director Administrativo IA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bot size={24} style={{ color: "var(--color-accent)" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              Director Administrativo IA
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            Diagnóstico ejecutivo, detección de riesgos financieros y recomendaciones accionables para <strong>{currentOrg?.name}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "var(--color-success-bg)", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-full)", border: "1px solid var(--color-success-border)" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--color-success)" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-success-text)" }}>
            Análisis Determinístico Activo
          </span>
        </div>
      </div>

      {/* 2. Tarjetas de Diagnóstico de Situación (Problemas / Riesgos / Oportunidades) */}
      <div className="grid grid-cols-3 md-grid-cols-1" style={{ gap: "1rem" }}>
        {/* Problemas / Mora */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <AlertTriangle size={16} style={{ color: "var(--color-danger-text)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-danger-text)" }}>
              {overdueCount} PROBLEMAS DETECTADOS
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }} className="tabular-nums">
            {formatCurrency(overdueTotal)}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            En mora activa. 2 clientes concentran el 72% del atraso.
          </p>
        </div>

        {/* Riesgos de Clientes */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-warning)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Building2 size={16} style={{ color: "var(--color-warning-text)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-warning-text)" }}>
              {atRiskCount} CLIENTES EN RIESGO
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Inactividad prolongada
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Superaron el promedio habitual de recompra por más de 15 días.
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
            {formatCurrency(activeQuotesTotal)}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            En {quotes.filter(q => q.status === "sent").length} presupuestos enviados próximos a cerrar.
          </p>
        </div>
      </div>

      {/* 3. Panel de Preguntas Sugeridas */}
      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
          Preguntas Rápidas al Director IA:
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

      {/* 4. Flujo de Respuestas Estructuradas */}
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
                  maxWidth: "85%",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: m.sender === "user" ? "var(--color-primary)" : "var(--color-bg-base)",
                  color: m.sender === "user" ? "#ffffff" : "var(--color-text-primary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  border: m.sender === "user" ? "none" : "1px solid var(--color-border-subtle)"
                }}
              >
                {m.text}

                {m.structuredData && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-default)", display: "flex", gap: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      <strong>Ventas:</strong> {formatCurrency(m.structuredData.totalSales || totalSales)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      <strong>Gastos:</strong> {formatCurrency(m.structuredData.totalExpenses || totalExpenses)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.8125rem", padding: "0.5rem" }}>
              <div className="skeleton" style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
              Analizando balance comercial de {currentOrg?.name}...
            </div>
          )}
        </div>

        {/* Input & Envío */}
        <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "0.75rem" }}>
          <input
            type="text"
            placeholder="Escribí una consulta sobre tus ventas, cobros o gastos..."
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
    </div>
  );
};
