import React, { useState } from "react";
import { Search } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Receivable, ReceivableStatus } from "../../types";
import { formatCurrency, formatDate, formatRelativeDays } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const ReceivablesView: React.FC = () => {
  const { receivables, recordPaymentReceivable, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.saleNumber && r.saleNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "pending" && r.status !== "paid") ||
      (statusFilter === "overdue" && r.status === "overdue") ||
      (statusFilter === "paid" && r.status === "paid");
    return matchesSearch && matchesStatus;
  });

  const totalPending = receivables.filter(r => r.status !== "paid").reduce((acc, r) => acc + r.balance, 0);
  const totalOverdue = receivables.filter(r => r.status === "overdue").reduce((acc, r) => acc + r.balance, 0);

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable || paymentAmount <= 0) return;
    recordPaymentReceivable(selectedReceivable.id, paymentAmount);
    setSelectedReceivable(null);
    setPaymentAmount(0);
  };

  const getStatusBadge = (status: ReceivableStatus, overdueDays: number) => {
    if (status === "paid") return <span className="badge badge-success">Cobrado</span>;
    if (status === "overdue" || overdueDays > 0) return <span className="badge badge-danger">Vencido ({overdueDays}d)</span>;
    if (status === "partial") return <span className="badge badge-warning">Parcial</span>;
    return <span className="badge badge-info">Pendiente</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Cobros (Cuentas a Cobrar)</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Gestión y seguimiento de deudas, vencimientos y cobranzas activas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md-grid-cols-1" style={{ gap: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>TOTAL CUENTAS POR COBRAR</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "0.25rem" }} className="tabular-nums">
            {formatCurrency(totalPending, currentOrg?.currency, currentOrg?.currencySymbol)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-danger-text)", textTransform: "uppercase" }}>DEUDAS VENCIDAS (EN MORA)</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-danger-text)", marginTop: "0.25rem" }} className="tabular-nums">
            {formatCurrency(totalOverdue, currentOrg?.currency, currentOrg?.currencySymbol)}
          </div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por cliente o comprobante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["pending", "overdue", "paid", "all"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                border: "none",
                backgroundColor: statusFilter === s ? "var(--color-primary-light)" : "transparent",
                color: statusFilter === s ? "var(--color-primary-text)" : "var(--color-text-secondary)",
                fontWeight: statusFilter === s ? 700 : 500,
                fontSize: "0.8125rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer"
              }}
            >
              {s === "pending" ? "Pendientes" : s === "overdue" ? "Vencidas" : s === "paid" ? "Cobrados" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Cliente</th>
              <th style={{ padding: "0.75rem 1rem" }}>Venta</th>
              <th style={{ padding: "0.75rem 1rem" }}>Vencimiento</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Monto Original</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Saldo Pendiente</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceivables.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No hay cuentas a cobrar en esta vista.
                </td>
              </tr>
            ) : (
              filteredReceivables.map(rec => (
                <tr
                  key={rec.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {rec.customerName}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-primary)", fontWeight: 600 }} className="tabular-nums">
                    {rec.saleNumber || "-"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    <div>{formatDate(rec.dueDate)}</div>
                    <div style={{ fontSize: "0.6875rem", color: rec.overdueDays > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>
                      {formatRelativeDays(rec.dueDate)}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{getStatusBadge(rec.status, rec.overdueDays)}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.8125rem", color: "var(--color-text-muted)" }} className="tabular-nums">
                    {formatCurrency(rec.amount, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: rec.balance > 0 ? "var(--color-danger-text)" : "var(--color-success-text)" }} className="tabular-nums">
                    {formatCurrency(rec.balance, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    {rec.status !== "paid" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { setSelectedReceivable(rec); setPaymentAmount(rec.balance); }}
                      >
                        Cobrar
                      </Button>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-success-text)", fontWeight: 600 }}>Saldado</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedReceivable && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceivable(null)}
          title="Registrar Cobro"
          subtitle={"Cliente: " + selectedReceivable.customerName + " — Saldo pendiente: " + formatCurrency(selectedReceivable.balance)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectedReceivable(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleRegisterPayment} disabled={paymentAmount <= 0}>
                Confirmar Cobro
              </Button>
            </>
          }
        >
          <form onSubmit={handleRegisterPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Monto Recibido ($) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedReceivable.balance}
                value={paymentAmount || ""}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "1rem", fontWeight: 700 }}
              />
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              El saldo del cliente y el estado de la cuenta a cobrar se actualizarán automáticamente.
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
};
