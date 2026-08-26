import React, { useState } from "react";
import {
  TrendingUp,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";
import { MetricCard } from "../ui/MetricCard";
import { RequiresAttention } from "./RequiresAttention";
import { Button } from "../ui/Button";

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

  const activeQuotesTotal = quotes
    .filter(q => q.status === "sent" || q.status === "draft")
    .reduce((acc, q) => acc + q.total, 0);

  const netCashFlow = totalSales - totalExpenses;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Buenos días, {currentUser?.fullName ? currentUser.fullName.split(" ")[0] : "Administrador"}
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

      <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1" style={{ gap: "1rem" }}>
        <MetricCard
          title="Ventas del período"
          value={formatCurrency(totalSales, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle={sales.length + " operaciones registradas"}
          trend={{ value: "12% vs mes anterior", isPositive: true }}
          statusColor="primary"
          icon={<TrendingUp size={20} />}
          actionText="Ver ventas"
          onAction={() => onNavigateToSection("sales")}
        />

        <MetricCard
          title="Gastos totales"
          value={formatCurrency(totalExpenses, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle="Cat. principal: Sueldos / Combustible"
          statusColor="warning"
          icon={<Receipt size={20} />}
          actionText="Ver gastos"
          onAction={() => onNavigateToSection("expenses")}
        />

        <MetricCard
          title="Cobros pendientes"
          value={formatCurrency(pendingReceivables, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle={overdueCount > 0 ? (overdueCount + " vencidos (" + formatCurrency(overdueReceivables) + ")") : "Al día"}
          statusColor={overdueCount > 0 ? "danger" : "success"}
          icon={<ArrowDownRight size={20} />}
          actionText="Gestionar cobros"
          onAction={() => onNavigateToSection("receivables")}
        />

        <MetricCard
          title="Pagos a proveedores"
          value={formatCurrency(pendingPayables, currentOrg?.currency, currentOrg?.currencySymbol)}
          subtitle="Próximo vencimiento en 3 días"
          statusColor="info"
          icon={<ArrowUpRight size={20} />}
          actionText="Ver pagos"
          onAction={() => onNavigateToSection("payables")}
        />
      </div>

      <RequiresAttention
        recommendations={recommendations}
        onApply={applyAIRecommendation}
        onDismiss={dismissAIRecommendation}
        onNavigateToSection={onNavigateToSection}
      />

      <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: "1.25rem" }}>
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Flujo de caja y resultado neto
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Ingresos realizados vs Egresos del período actual
              </p>
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: 800, color: netCashFlow >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }} className="tabular-nums">
              Resultado: {formatCurrency(netCashFlow)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", backgroundColor: "var(--color-bg-base)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>INGRESOS</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-success-text)" }} className="tabular-nums">
                {formatCurrency(totalSales)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>EGRESOS</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-danger-text)" }} className="tabular-nums">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>MARGEN ESTIMADO</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }} className="tabular-nums">
                ~38.4%
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Presupuestos abiertos
              </h3>
              <FileSpreadsheet size={18} style={{ color: "var(--color-text-muted)" }} />
            </div>

            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.25rem" }} className="tabular-nums">
              {formatCurrency(activeQuotesTotal)}
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              {quotes.filter(q => q.status === "sent").length} cotizaciones enviadas con vencimiento próximo.
            </p>
          </div>

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-subtle)" }}>
            <Button
              variant="outline"
              size="sm"
              style={{ width: "100%" }}
              onClick={() => onNavigateToSection("quotes")}
            >
              Ver presupuestos a cerrar →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
