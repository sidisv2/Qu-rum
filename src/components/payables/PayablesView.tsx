import React, { useState } from "react";
import { useOrg } from "../../context/OrgContext";
import { Payable } from "../../types";
import { formatCurrency, formatDate, formatRelativeDays } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const PayablesView: React.FC = () => {
  const { payables, recordPaymentPayable, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const filteredPayables = payables.filter(p =>
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = payables.filter(p => p.status !== "paid").reduce((acc, p) => acc + p.balance, 0);

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || paymentAmount <= 0) return;
    recordPaymentPayable(selectedPayable.id, paymentAmount);
    setSelectedPayable(null);
    setPaymentAmount(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Pagos (Cuentas a Pagar)</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Vencimientos de proveedores, compras y servicios pendientes.
          </p>
        </div>
      </div>

      <div className="card" style={{ borderLeft: "4px solid var(--color-info)" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>TOTAL CUENTAS POR PAGAR</span>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "0.25rem" }} className="tabular-nums">
          {formatCurrency(totalPending, currentOrg?.currency, currentOrg?.currencySymbol)}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Proveedor</th>
              <th style={{ padding: "0.75rem 1rem" }}>Vencimiento</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Monto</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Saldo a Pagar</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayables.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No hay pagos registrados.
                </td>
              </tr>
            ) : (
              filteredPayables.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>{p.supplierName}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem" }}>
                    <div>{formatDate(p.dueDate)}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-warning-text)" }}>{formatRelativeDays(p.dueDate)}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {p.status === "paid" ? (
                      <span className="badge badge-success">Pagado</span>
                    ) : (
                      <span className="badge badge-warning">Pendiente</span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.8125rem" }} className="tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }} className="tabular-nums">
                    {formatCurrency(p.balance)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    {p.status !== "paid" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { setSelectedPayable(p); setPaymentAmount(p.balance); }}
                      >
                        Pagar
                      </Button>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-success-text)", fontWeight: 600 }}>Completado</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPayable && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayable(null)}
          title="Registrar Pago a Proveedor"
          subtitle={"Proveedor: " + selectedPayable.supplierName + " — Saldo adeudado: " + formatCurrency(selectedPayable.balance)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectedPayable(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handlePaySubmit} disabled={paymentAmount <= 0}>
                Confirmar Pago
              </Button>
            </>
          }
        >
          <form onSubmit={handlePaySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Monto Desembolsado ($) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedPayable.balance}
                value={paymentAmount || ""}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "1rem", fontWeight: 700 }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
