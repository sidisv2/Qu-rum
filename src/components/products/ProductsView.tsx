import React, { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency, calculateMargin } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const ProductsView: React.FC = () => {
  const { products, createProduct, deleteProduct, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "General",
    cost: 0,
    price: 0,
    stock: 10
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) return;
    const margin = calculateMargin(formData.price, formData.cost);
    createProduct({
      ...formData,
      sku: formData.sku || "SKU-" + Math.floor(1000 + Math.random() * 9000),
      cost: Number(formData.cost),
      price: Number(formData.price),
      marginAmount: margin.amount,
      marginPercent: margin.percent,
      status: "active"
    });
    setIsCreateOpen(false);
    setFormData({ name: "", sku: "", category: "General", cost: 0, price: 0, stock: 10 });
  };

  const marginPreview = calculateMargin(formData.price, formData.cost);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Productos y Servicios</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Catálogo maestro, márgenes brutos calculados y costos.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nuevo Producto
        </Button>
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)" }}>
        <Search size={16} style={{ color: "var(--color-text-muted)" }} />
        <input
          type="text"
          placeholder="Buscar por nombre, código SKU o categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Código</th>
              <th style={{ padding: "0.75rem 1rem" }}>Producto / Servicio</th>
              <th style={{ padding: "0.75rem 1rem" }}>Categoría</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Costo</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Precio Venta</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Margen (%)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No se encontraron productos registrados.
                </td>
              </tr>
            ) : (
              filteredProducts.map(prod => (
                <tr
                  key={prod.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.8125rem" }} className="tabular-nums">
                    {prod.sku}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {prod.name}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className="badge badge-neutral">{prod.category}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--color-text-secondary)" }} className="tabular-nums">
                    {formatCurrency(prod.cost, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }} className="tabular-nums">
                    {formatCurrency(prod.price, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: prod.marginPercent >= 30 ? "var(--color-success-text)" : "var(--color-warning-text)" }} className="tabular-nums">
                    {prod.marginPercent}% ({formatCurrency(prod.marginAmount)})
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <button
                      onClick={() => deleteProduct(prod.id)}
                      style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.25rem" }}
                      title="Eliminar producto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Nuevo Producto / Servicio"
          subtitle="Cargar artículo al inventario y calcular margen"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={!formData.name.trim() || formData.price <= 0}>
                Guardar Producto
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Nombre del Producto / Servicio *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Código SKU (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: PROD-100"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Costo ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cost || ""}
                  onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Precio de Venta ($) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price || ""}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-bg-base)", padding: "0.75rem", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>Margen estimado:</span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: marginPreview.percent >= 30 ? "var(--color-success-text)" : "var(--color-warning-text)" }} className="tabular-nums">
                {marginPreview.percent}% ({formatCurrency(marginPreview.amount)})
              </span>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
