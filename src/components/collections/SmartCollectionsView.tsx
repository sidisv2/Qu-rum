import React, { useState } from "react";
import { AlertTriangle, Clock, CheckCircle, Copy, Check, Sparkles, MessageCircle } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Button } from "../ui/Button";

export const SmartCollectionsView: React.FC = () => {
  const { receivables, customers } = useOrg();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingReceivables = receivables.filter(r => r.status === "pending" || r.status === "overdue" || r.status === "partial");

  const now = Date.now();
  const collectionsWithRisk = pendingReceivables.map(r => {
    const customer = customers.find(c => c.id === r.customerId);
    const dueDate = new Date(r.dueDate).getTime();
    const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
    
    let riskLevel: "on_time" | "mild" | "critical" = "on_time";
    if (daysOverdue > 15) {
      riskLevel = "critical";
    } else if (daysOverdue > 0) {
      riskLevel = "mild";
    }

    const priorityScore = (r.balance || r.amount) * (daysOverdue + 1);

    const customerName = customer?.name || "Estimado cliente";
    const suggestedMessage = daysOverdue > 15
      ? `Estimado ${customerName}, nos comunicamos desde Administración. Registramos una factura pendiente por $${(r.balance || r.amount).toLocaleString("es-AR")} con ${daysOverdue} días de atraso. Le solicitamos regularizar el comprobante para evitar la suspensión de servicios/entregas.`
      : daysOverdue > 0
      ? `Hola ${customerName}, esperamos que te encuentres bien. Te recordamos que la factura por $${(r.balance || r.amount).toLocaleString("es-AR")} venció hace ${daysOverdue} días. Por favor, confirmanos la fecha estimada de pago.`
      : `Hola ${customerName}, recordamos que la factura por $${(r.balance || r.amount).toLocaleString("es-AR")} tiene fecha de vencimiento próxima. Quedamos a disposición ante cualquier consulta.`;

    return {
      ...r,
      customerName,
      daysOverdue,
      riskLevel,
      priorityScore,
      suggestedMessage
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={22} style={{ color: "var(--color-primary, #4f46e5)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Cobros a Gestionar Hoy (Recordatorios Inteligentes)
          </h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Priorización automática de cobranzas y redacción de mensajes sugeridos por el Director IA. No procesa pagos ni realiza envíos automáticos.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Mora Crítica (+15 días)</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginTop: "0.25rem" }}>
            {collectionsWithRisk.filter(c => c.riskLevel === "critical").length} clientes
          </div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Atraso Leve (1-15 días)</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b", marginTop: "0.25rem" }}>
            {collectionsWithRisk.filter(c => c.riskLevel === "mild").length} clientes
          </div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Al Día / Próximos a Vencer</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981", marginTop: "0.25rem" }}>
            {collectionsWithRisk.filter(c => c.riskLevel === "on_time").length} clientes
          </div>
        </div>
      </div>

      {collectionsWithRisk.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <CheckCircle size={40} style={{ color: "#10b981", margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            ¡Excelente! No tenés cobranzas atrasadas
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Todas las cuentas de tu empresa se encuentran regularizadas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {collectionsWithRisk.map(item => (
            <div
              key={item.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                borderLeft: `4px solid ${item.riskLevel === "critical" ? "#ef4444" : item.riskLevel === "mild" ? "#f59e0b" : "#10b981"}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--color-text-primary)" }}>
                      {item.customerName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "9999px",
                        backgroundColor: item.riskLevel === "critical" ? "#fee2e2" : item.riskLevel === "mild" ? "#fef3c7" : "#d1fae5",
                        color: item.riskLevel === "critical" ? "#991b1b" : item.riskLevel === "mild" ? "#92400e" : "#065f46"
                      }}
                    >
                      {item.riskLevel === "critical" ? `🔴 +${item.daysOverdue} días de mora` : item.riskLevel === "mild" ? `🟡 ${item.daysOverdue} días de atraso` : "🟢 Al día"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                    Comprobante: {item.saleId ? item.saleId.substring(0, 8) : item.id.substring(0, 8)} • Vencimiento: {new Date(item.dueDate).toLocaleDateString("es-AR")}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
                    ${(item.balance || item.amount).toLocaleString("es-AR")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Saldo adeudado</div>
                </div>
              </div>

              {/* Mensaje sugerido por Director IA */}
              <div
                style={{
                  backgroundColor: "var(--color-bg-base, #f8fafc)",
                  padding: "0.875rem",
                  borderRadius: "var(--radius-md, 0.5rem)",
                  border: "1px solid var(--color-border-subtle, #e2e8f0)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary, #4f46e5)" }}>
                    <MessageCircle size={14} />
                    <span>Mensaje sugerido por el Director IA:</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(item.id, item.suggestedMessage)}
                    icon={copiedId === item.id ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  >
                    {copiedId === item.id ? "¡Copiado!" : "Copiar mensaje"}
                  </Button>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{item.suggestedMessage}"
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
