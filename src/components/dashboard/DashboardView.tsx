import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";
import { MetricCard } from "../ui/MetricCard";
import { RequiresAttention } from "./RequiresAttention";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { InsightEngine } from "../../lib/intelligence/insightEngine";
import { BusinessInsight } from "../../lib/intelligence/types";
import { useToast } from "../ui/Toast";
import { OnboardingGuide } from "../onboarding/OnboardingGuide";

interface DashboardViewProps {
  onNavigateToSection: (section: any) => void;
  onOpenQuickSale: () => void;
  onOpenQuickExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToSection
}) => {
  const {
    currentUser,
    currentOrg,
    sales,
    expenses,
    receivables,
    payables,
    quotes,
    customers,
    products,
    createTask
  } = useOrg();

  const { showToast } = useToast();
  const [periodFilter, setPeriodFilter] = useState<"today" | "week" | "month">("month");
  const [explanationMetric, setExplanationMetric] = useState<{ title: string; explanation: string; factors: Array<{ name: string; impact: string }> } | null>(null);

  // Motor Unificado de Inteligencia
  const analytics = useMemo(() => {
    return InsightEngine.analyze({
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

  const { salesMetrics, expensesMetrics, receivablesMetrics, quotesMetrics, insights } = analytics;
  const netCashFlow = salesMetrics.totalSales - expensesMetrics.totalExpenses;
  const grossMarginPercent = salesMetrics.totalSales > 0
    ? Math.round(((salesMetrics.totalSales - expensesMetrics.totalExpenses) / salesMetrics.totalSales) * 1000) / 10
    : 0;

  const handleActionInsight = (insight: BusinessInsight) => {
    if (insight.suggestedAction.actionType === "send_reminder") {
      onNavigateToSection("receivables");
      showToast("Accediendo a cuentas en mora");
    } else if (insight.suggestedAction.actionType === "view_quote") {
      onNavigateToSection("quotes");
      showToast("Accediendo a presupuestos");
    } else if (insight.suggestedAction.actionType === "view_customer") {
      onNavigateToSection("customers");
      showToast("Accediendo a ficha del cliente");
    } else if (insight.suggestedAction.actionType === "view_expense") {
      onNavigateToSection("expenses");
      showToast("Accediendo a gastos");
    } else {
      createTask({
        title: insight.suggestedAction.label,
        description: insight.description,
        priority: insight.severity === "critical" ? "high" : "medium",
        dueDate: new Date().toISOString().split("T")[0],
        status: "pending"
      });
      showToast("Tarea creada a partir del insight");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. Header & Saludo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
            Buenos días, {currentUser?.fullName ? currentUser.fullName.split(" ")[0] : "Valentín"}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            Esto es lo más importante de tu negocio hoy en <strong>{currentOrg?.name}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "var(--color-bg-muted)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
          {(["today", "week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              style={{
                border: "none",
                backgroundColor: periodFilter === p ? "#ffffff" : "transparent",
                color: periodFilter === p ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: periodFilter === p ? 700 : 500,
                fontSize: "0.8125rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                boxShadow: periodFilter === p ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              {p === "today" ? "Hoy" : p === "week" ? "Esta semana" : "Este mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Guía interactiva de Onboarding para cuentas nuevas (< 3 operaciones) */}
      <OnboardingGuide
        onNavigateToSection={onNavigateToSection}
        salesCount={sales.length}
        expensesCount={expenses.length}
      />

      {/* 2. Cuadrante de KPIs con "¿Por qué cambió?" */}
      <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1" style={{ gap: "1rem" }}>
        <div style={{ position: "relative" }}>
          <MetricCard
            title="Ventas del período"
            value={formatCurrency(salesMetrics.totalSales, currentOrg?.currency, currentOrg?.currencySymbol)}
            subtitle={salesMetrics.salesCount + " operaciones (Ticket prom: " + formatCurrency(salesMetrics.averageTicket) + ")"}
            trend={salesMetrics.evolution.hasEnoughData ? { value: salesMetrics.evolution.percentChange + "% vs mes anterior", isPositive: salesMetrics.evolution.percentChange >= 0 } : undefined}
            statusColor="primary"
            icon={<TrendingUp size={20} />}
            actionText="Ver ventas"
            onAction={() => onNavigateToSection("sales")}
          />
          <button
            onClick={() => setExplanationMetric({
              title: "Ventas del Período",
              explanation: salesMetrics.evolution.explanation,
              factors: salesMetrics.totalSales > 0 ? [
                { name: "Ventas del período", impact: formatCurrency(salesMetrics.totalSales) }
              ] : [
                { name: "Sin registros", impact: "$0" }
              ]
            })}
            style={{
              position: "absolute",
              top: "0.875rem",
              right: "0.875rem",
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              fontSize: "0.6875rem",
              fontWeight: 600
            }}
            title="¿Por qué cambió esta métrica?"
          >
            <HelpCircle size={13} />
            <span>¿Por qué?</span>
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <MetricCard
            title="Gastos totales"
            value={formatCurrency(expensesMetrics.totalExpenses, currentOrg?.currency, currentOrg?.currencySymbol)}
            subtitle={expensesMetrics.totalExpenses > 0 ? "Gastos operativos registrados" : "Sin gastos registrados"}
            statusColor="warning"
            icon={<Receipt size={20} />}
            actionText="Ver gastos"
            onAction={() => onNavigateToSection("expenses")}
          />
          <button
            onClick={() => setExplanationMetric({
              title: "Estructura de Gastos",
              explanation: expensesMetrics.totalExpenses > 0 ? "Desglose de gastos operativos por categoría." : "No se registraron gastos en el período.",
              factors: expensesMetrics.totalExpenses > 0 ? Object.entries(expensesMetrics.byCategory).map(([k, v]) => ({ name: k, impact: formatCurrency(v) })) : [{ name: "Sin gastos", impact: "$0" }]
            })}
            style={{
              position: "absolute",
              top: "0.875rem",
              right: "0.875rem",
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              fontSize: "0.6875rem",
              fontWeight: 600
            }}
            title="¿Por qué cambió esta métrica?"
          >
            <HelpCircle size={13} />
            <span>¿Por qué?</span>
          </button>
        </div>

        <MetricCard
          title="Por cobrar (Total)"
          value={formatCurrency(receivablesMetrics.totalPending, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle={receivablesMetrics.overdueCount > 0 ? (receivablesMetrics.overdueCount + " vencidas (" + formatCurrency(receivablesMetrics.totalOverdue) + ")") : "Al día"}
          statusColor={receivablesMetrics.overdueCount > 0 ? "danger" : "success"}
          icon={<ArrowDownRight size={20} />}
          actionText="Gestionar cobros"
          onAction={() => onNavigateToSection("receivables")}
        />

        <MetricCard
          title="Presupuestos abiertos"
          value={formatCurrency(quotesMetrics.activeQuotesTotal, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle={quotesMetrics.expiringSoonCount > 0 ? (quotesMetrics.expiringSoonCount + " vencen esta semana") : "En seguimiento"}
          statusColor="info"
          icon={<ArrowUpRight size={20} />}
          actionText="Ver cotizaciones"
          onAction={() => onNavigateToSection("quotes")}
        />
      </div>

      {/* 3. Sección "Requiere Atención" (Consumiendo Insight Engine) */}
      <RequiresAttention
        insights={insights}
        onActionClick={handleActionInsight}
        onDismiss={() => {}}
        onNavigateToSection={onNavigateToSection}
      />

      {/* 4. Flujo de Caja y Acceso al Director IA */}
      <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: "1.25rem" }}>
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Flujo de caja y resultado operativo
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Ingresos realizados vs Egresos del período
              </p>
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: 800, color: netCashFlow >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }} className="tabular-nums">
              Resultado: {formatCurrency(netCashFlow)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", backgroundColor: "var(--color-bg-base)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>INGRESOS</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-success-text)" }} className="tabular-nums">
                {formatCurrency(salesMetrics.totalSales)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>EGRESOS</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-danger-text)" }} className="tabular-nums">
                {formatCurrency(expensesMetrics.totalExpenses)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>MARGEN OPERATIVO</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }} className="tabular-nums">
                {grossMarginPercent}%
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Director IA
              </h3>
              <Sparkles size={18} style={{ color: "var(--color-accent)" }} />
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.4, marginBottom: "1rem" }}>
              {insights.length > 0
                ? insights[0].title + ". " + insights[0].description
                : "Todos los indicadores de tu empresa están al día."}
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            style={{ width: "100%" }}
            onClick={() => onNavigateToSection("director-ia")}
          >
            Consultar Director IA →
          </Button>
        </div>
      </div>

      {/* Drawer Explicativo de Métricas */}
      {explanationMetric && (
        <Drawer
          isOpen={true}
          onClose={() => setExplanationMetric(null)}
          title={explanationMetric.title}
          subtitle="Desglose analítico respaldado por transacciones reales"
          footer={
            <Button variant="primary" size="sm" onClick={() => setExplanationMetric(null)}>
              Entendido
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
              <h4 style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
                Explicación Determinística
              </h4>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                {explanationMetric.explanation}
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>Factores Principales:</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {explanationMetric.factors.map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", backgroundColor: "#ffffff", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}>
                    <span style={{ fontWeight: 600 }}>{f.name}</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--color-primary)" }}>{f.impact}</span>
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
