import React from "react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";

export const AnalysisView: React.FC = () => {
  const { sales, expenses, currentOrg } = useOrg();

  const totalSales = sales.reduce((acc, s) => acc + (s.status !== "cancelled" ? s.total : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netMargin = totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0;

  const expenseByCat: Record<string, number> = {};
  expenses.forEach(e => {
    expenseByCat[e.category] = (expenseByCat[e.category] || 0) + e.amount;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Análisis de Rentabilidad y Gestión
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Evolución de márgenes brutos, estructura de costos e indicadores de rendimiento.
        </p>
      </div>

      <div className="grid grid-cols-3 lg-grid-cols-1" style={{ gap: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>VENTAS CONSOLIDADAS</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.25rem" }} className="tabular-nums">
            {formatCurrency(totalSales, currentOrg?.currency, currentOrg?.currencySymbol)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>COSTOS Y GASTOS</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--color-danger-text)" }} className="tabular-nums">
            {formatCurrency(totalExpenses, currentOrg?.currency, currentOrg?.currencySymbol)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>MARGEN OPERATIVO</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--color-success-text)" }} className="tabular-nums">
            {Math.round(netMargin * 10) / 10}%
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Estructura de Gastos por Categoría
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Object.entries(expenseByCat).map(([cat, amt]) => {
            const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
            return (
              <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                  <span className="tabular-nums">{formatCurrency(amt)} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "var(--color-bg-muted)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", backgroundColor: "var(--color-primary)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
