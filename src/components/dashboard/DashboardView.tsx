import React, { useState } from "react";
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
    recommendations,
    applyAIRecommendation,
    dismissAIRecommendation
  } = useOrg();

  const [periodFilter, setPeriodFilter] = useState<"today" | "week" | "month">("month");
  const [explanationMetric, setExplanationMetric] = useState<{ title: string; explanation: string; reason: string } | null>(null);

  const totalSales = sales.reduce((acc, s) => acc + (s.status !== "cancelled" ? s.total : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const pendingReceivables = receivables
    .filter(r => r.status !== "paid")
    .reduce((acc, r) => acc + r.balance, 0);
  const overdueReceivables = receivables
    .filter(r => r.status === "overdue")
    .reduce((acc, r) => acc + r.balance, 0);
  const overdueCount = receivables.filter(r => r.status === "overdue").length;

  const pendingPayables = payables
    .filter(p => p.status !== "paid")
    .reduce((acc, p) => acc + p.balance, 0);

  const netCashFlow = totalSales - totalExpenses;
  const grossMarginPercent = totalSales > 0 ? Math.round(((totalSales - totalExpenses) / totalSales) * 1000) / 10 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. Header & Saludo de Alto Impacto */}
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

      {/* 2. Cuadrante de KPIs Ejecutivos con "¿Por qué cambió?" */}
      <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1" style={{ gap: "1rem" }}>
        <div style={{ position: "relative" }}>
          <MetricCard
            title="Ventas del período"
            value={formatCurrency(totalSales, currentOrg?.currency, currentOrg?.currencySymbol)}
            subtitle={sales.length + " operaciones registradas"}
            trend={{ value: "12,4% vs mes anterior", isPositive: true }}
            statusColor="primary"
            icon={<TrendingUp size={20} />}
            actionText="Ver ventas"
            onAction={() => onNavigateToSection("sales")}
          />
          <button
            onClick={() => setExplanationMetric({
              title: "Ventas del Período",
              explanation: "Tus ventas crecieron un 12,4% respecto al mes anterior impulsadas por la venta mayorista a Ferretería Central y Distribuidora Sur.",
              reason: "3 clientes corporativos incrementaron su volumen de compra un 35%."
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
            value={formatCurrency(totalExpenses, currentOrg?.currency, currentOrg?.currencySymbol)}
            subtitle="Mayor costo: Combustibles e Insumos"
            trend={{ value: "4,2% vs mes anterior", isPositive: false }}
            statusColor="warning"
            icon={<Receipt size={20} />}
            actionText="Ver gastos"
            onAction={() => onNavigateToSection("expenses")}
          />
          <button
            onClick={() => setExplanationMetric({
              title: "Estructura de Gastos",
              explanation: "Se detectó un incremento del 18% en Combustible por rutas logísticas adicionales.",
              reason: "El gasto mensual se mantiene dentro del 58% de las ventas brutas."
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
          title="Por cobrar (Pendiente)"
          value={formatCurrency(pendingReceivables, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle={overdueCount > 0 ? (overdueCount + " vencidas (" + formatCurrency(overdueReceivables) + ")") : "Al día"}
          statusColor={overdueCount > 0 ? "danger" : "success"}
          icon={<ArrowDownRight size={20} />}
          actionText="Gestionar cobros"
          onAction={() => onNavigateToSection("receivables")}
        />

        <MetricCard
          title="Por pagar a proveedores"
          value={formatCurrency(pendingPayables, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle="Próximo vencimiento en 3 días"
          statusColor="info"
          icon={<ArrowUpRight size={20} />}
          actionText="Ver pagos"
          onAction={() => onNavigateToSection("payables")}
        />
      </div>

      {/* 3. Sección Central "Requiere Atención" (Foco de Valor) */}
      <RequiresAttention
        recommendations={recommendations}
        onApply={applyAIRecommendation}
        onDismiss={dismissAIRecommendation}
        onNavigateToSection={onNavigateToSection}
      />

      {/* 4. Flujo de Caja y Pipeline de Presupuestos */}
      <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: "1.25rem" }}>
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Flujo de caja y resultado neto
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
                {formatCurrency(totalSales)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>EGRESOS</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-danger-text)" }} className="tabular-nums">
                {formatCurrency(totalExpenses)}
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
              Analicé el estado financiero de <strong>{currentOrg?.name}</strong>: 2 clientes concentran el 72% de la mora pendiente.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            style={{ width: "100%" }}
            onClick={() => onNavigateToSection("director-ia")}
          >
            Abrir Director IA →
          </Button>
        </div>
      </div>

      {/* Drawer Contextual "¿Por qué cambió?" */}
      {explanationMetric && (
        <Drawer
          isOpen={true}
          onClose={() => setExplanationMetric(null)}
          title={explanationMetric.title}
          subtitle="Explicación analítica basada en datos reales"
          footer={
            <Button variant="primary" size="sm" onClick={() => setExplanationMetric(null)}>
              Entendido
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ backgroundColor: "var(--color-accent-light)", borderColor: "var(--color-accent-border)" }}>
              <h4 style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-accent-text)", marginBottom: "0.25rem" }}>
                Diagnóstico Automático
              </h4>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>
                {explanationMetric.explanation}
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>Factor Principal</h4>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                {explanationMetric.reason}
              </p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
