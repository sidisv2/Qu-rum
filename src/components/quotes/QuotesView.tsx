import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Quote, QuoteStatus } from "../../types";
import { formatCurrency, formatDate, formatRelativeDays } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const QuotesView: React.FC = () => {
  const { quotes, customers, products, createQuote, updateQuoteStatus, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<Array<{ productId: string; description: string; quantity: number; unitPrice: number }>>([
    { productId: "", description: "", quantity: 1, unitPrice: 0 }
  ]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
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

  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer || items.length === 0 || subtotal <= 0) return;

    createQuote({
      customerId: customer.id,
      customerName: customer.name,
      quoteNumber: "PRE-" + Math.floor(10000 + Math.random() * 90000),
      items: items.map((it, idx) => ({
        id: "qitem-" + Date.now() + "-" + idx,
        productId: it.productId,
        description: it.description || "Ítem",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.quantity * it.unitPrice
      })),
      total: subtotal,
      validUntil,
      status: "sent",
      notes
    });

    setIsCreateOpen(false);
    setSelectedCustomerId("");
    setItems([{ productId: "", description: "", quantity: 1, unitPrice: 0 }]);
    setNotes("");
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case "accepted": return <span className="badge badge-success">Aceptado</span>;
      case "sent": return <span className="badge badge-info">Enviado</span>;
      case "draft": return <span className="badge badge-neutral">Borrador</span>;
      case "rejected": return <span className="badge badge-danger">Rechazado</span>;
      case "expired": return <span className="badge badge-warning">Vencido</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Presupuestos y Cotizaciones</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Pipeline comercial, seguimiento de vencimientos y tasa de conversión.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por presupuesto o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "sent", "accepted", "draft", "expired"] as const).map(s => (
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
              {s === "all" ? "Todos" : s === "sent" ? "Enviados" : s === "accepted" ? "Aceptados" : s === "draft" ? "Borradores" : "Vencidos"}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Número</th>
              <th style={{ padding: "0.75rem 1rem" }}>Cliente</th>
              <th style={{ padding: "0.75rem 1rem" }}>Vencimiento</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total Cotizado</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No hay presupuestos en esta sección.
                </td>
              </tr>
            ) : (
              filteredQuotes.map(quote => (
                <tr
                  key={quote.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--color-primary)" }} className="tabular-nums">
                    {quote.quoteNumber}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {quote.customerName}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    <div>{formatDate(quote.validUntil)}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-warning-text)" }}>{formatRelativeDays(quote.validUntil)}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{getStatusBadge(quote.status)}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }} className="tabular-nums">
                    {formatCurrency(quote.total, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedQuote(quote)}
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedQuote && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuote(null)}
          title={"Presupuesto " + selectedQuote.quoteNumber}
          subtitle={"Cliente: " + selectedQuote.customerName + " — Válido hasta: " + formatDate(selectedQuote.validUntil)}
          footer={
            <>
              {selectedQuote.status === "sent" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { updateQuoteStatus(selectedQuote.id, "accepted"); setSelectedQuote(null); }}
                >
                  Marcar como Aceptado
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedQuote(null)}>
                Cerrar
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-bg-base)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>ESTADO: </span>
                {getStatusBadge(selectedQuote.status)}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }} className="tabular-nums">
                Total: {formatCurrency(selectedQuote.total)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Ítems presupuestados:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {selectedQuote.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.8125rem" }}>
                    <div>{it.description} <span style={{ color: "var(--color-text-muted)" }}>x {it.quantity}</span></div>
                    <div style={{ fontWeight: 600 }} className="tabular-nums">{formatCurrency(it.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedQuote.notes && (
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                <strong>Observaciones:</strong> {selectedQuote.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Nuevo Presupuesto"
          subtitle="Generar cotización comercial para un cliente"
          maxWidth="620px"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={!selectedCustomerId || subtotal <= 0}>
                Crear Presupuesto
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Cliente *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              >
                <option value="">-- Seleccionar cliente --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Válido hasta
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  Productos / Servicios
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  + Agregar ítem
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
                    onChange={e => {
                      const upd = [...items];
                      upd[idx].quantity = Number(e.target.value);
                      setItems(upd);
                    }}
                    style={{ padding: "0.4rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  />
                  <input
                    type="number"
                    placeholder="Precio Unitario"
                    value={item.unitPrice}
                    onChange={e => {
                      const upd = [...items];
                      upd[idx].unitPrice = Number(e.target.value);
                      setItems(upd);
                    }}
                    style={{ padding: "0.4rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ textAlign: "right", fontSize: "1.125rem", fontWeight: 800 }} className="tabular-nums">
              Total: {formatCurrency(subtotal)}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
