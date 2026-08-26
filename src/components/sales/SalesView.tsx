import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Sale, SaleStatus, PaymentStatus } from "../../types";
import { formatCurrency, formatDate } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const SalesView: React.FC = () => {
  const { sales, customers, products, createSale, updateSaleStatus, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<Array<{ productId: string; description: string; quantity: number; unitPrice: number }>>([
    { productId: "", description: "", quantity: 1, unitPrice: 0 }
  ]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    setItems([...items, { productId: "", description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    const updated = [...items];
    if (prod) {
      updated[index] = {
        productId: prod.id,
        description: prod.name,
        quantity: updated[index].quantity || 1,
        unitPrice: prod.price
      };
    } else {
      updated[index].productId = productId;
    }
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = qty;
    setItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...items];
    updated[index].unitPrice = price;
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer || items.length === 0 || subtotal <= 0) return;

    createSale({
      customerId: customer.id,
      customerName: customer.name,
      saleNumber: "VTA-" + Math.floor(10000 + Math.random() * 90000),
      items: items.map((it, idx) => ({
        id: "item-" + Date.now() + "-" + idx,
        productId: it.productId,
        description: it.description || "Producto",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.quantity * it.unitPrice
      })),
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      status: "confirmed",
      paymentStatus,
      date: new Date().toISOString().split("T")[0]
    });

    setIsCreateOpen(false);
    setSelectedCustomerId("");
    setItems([{ productId: "", description: "", quantity: 1, unitPrice: 0 }]);
  };

  const getStatusBadge = (status: SaleStatus) => {
    switch (status) {
      case "completed": return <span className="badge badge-success">Completada</span>;
      case "confirmed": return <span className="badge badge-info">Confirmada</span>;
      case "pending": return <span className="badge badge-warning">Pendiente</span>;
      case "cancelled": return <span className="badge badge-danger">Cancelada</span>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "paid": return <span className="badge badge-success">Pagado</span>;
      case "partial": return <span className="badge badge-warning">Parcial</span>;
      case "unpaid": return <span className="badge badge-danger">Impago</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Ventas</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Registro comercial de operaciones, facturación y estados de cobro.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nueva Venta
        </Button>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por comprobante o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "confirmed", "completed", "pending", "cancelled"] as const).map(s => (
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
              {s === "all" ? "Todas" : s === "confirmed" ? "Confirmadas" : s === "completed" ? "Completadas" : s === "pending" ? "Pendientes" : "Canceladas"}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Comprobante</th>
              <th style={{ padding: "0.75rem 1rem" }}>Cliente</th>
              <th style={{ padding: "0.75rem 1rem" }}>Fecha</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado Venta</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado Cobro</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No se registraron ventas con el criterio seleccionado.
                </td>
              </tr>
            ) : (
              filteredSales.map(sale => (
                <tr
                  key={sale.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--color-primary)" }} className="tabular-nums">
                    {sale.saleNumber}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {sale.customerName}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    {formatDate(sale.date)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{getStatusBadge(sale.status)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{getPaymentBadge(sale.paymentStatus)}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }} className="tabular-nums">
                    {formatCurrency(sale.total, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedSale(sale)}
                    >
                      Ver Detalle
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSale(null)}
          title={"Venta " + selectedSale.saleNumber}
          subtitle={"Cliente: " + selectedSale.customerName + " — Fecha: " + formatDate(selectedSale.date)}
          footer={
            <>
              {selectedSale.status !== "completed" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { updateSaleStatus(selectedSale.id, "completed"); setSelectedSale(null); }}
                >
                  Marcar como Completada
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedSale(null)}>
                Cerrar
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-bg-base)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>ESTADO: </span>
                {getStatusBadge(selectedSale.status)}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }} className="tabular-nums">
                Total: {formatCurrency(selectedSale.total)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Ítems / Productos:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {selectedSale.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.8125rem" }}>
                    <div>{it.description} <span style={{ color: "var(--color-text-muted)" }}>x {it.quantity}</span></div>
                    <div style={{ fontWeight: 600 }} className="tabular-nums">{formatCurrency(it.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSale.notes && (
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                <strong>Observaciones:</strong> {selectedSale.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Nueva Venta"
          subtitle="Registrar venta y generar cuenta a cobrar automáticamente si aplica"
          maxWidth="620px"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={!selectedCustomerId || subtotal <= 0}>
                Confirmar Venta
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Seleccionar Cliente *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              >
                <option value="">-- Seleccionar cliente --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.totalPendingDebt > 0 ? "(Deuda: $" + c.totalPendingDebt.toLocaleString("es-AR") + ")" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Condición de Pago
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              >
                <option value="unpaid">Cuenta Corriente / A cobrar (Genera deuda)</option>
                <option value="partial">Pago parcial 50% / Saldo a cobrar</option>
                <option value="paid">Cobrado de contado en el acto</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  Productos / Ítems *
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  + Agregar producto
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <select
                    value={item.productId}
                    onChange={e => handleProductChange(idx, e.target.value)}
                    style={{ padding: "0.4rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  >
                    <option value="">-- Elegir producto --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price.toLocaleString("es-AR")})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Cantidad"
                    value={item.quantity}
                    onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                    style={{ padding: "0.4rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  />
                  <input
                    type="number"
                    placeholder="Precio Unitario"
                    value={item.unitPrice}
                    onChange={e => handlePriceChange(idx, Number(e.target.value))}
                    style={{ padding: "0.4rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ textAlign: "right", fontSize: "1.125rem", fontWeight: 800, marginTop: "0.5rem" }} className="tabular-nums">
              Total Venta: {formatCurrency(subtotal)}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
