import React, { useState } from "react";
import { Plus, Search, AlertCircle, Trash2 } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency, formatDate } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const ExpensesView: React.FC = () => {
  const { expenses, suppliers, createExpense, deleteExpense, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    category: "Combustible",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    isAnomaly: false,
    anomalyReason: ""
  });

  const categories = ["Combustible", "Materia Prima e Insumos", "Alquiler y Servicios", "Sueldos y Cargas Sociales", "Impuestos", "Mantenimiento"];

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.supplierName && e.supplierName.toLowerCase().includes(search.toLowerCase())) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;
    const sup = suppliers.find(s => s.id === formData.supplierId);
    createExpense({
      ...formData,
      supplierName: sup ? sup.name : "Varios",
      amount: Number(formData.amount)
    });
    setIsCreateOpen(false);
    setFormData({
      supplierId: "",
      supplierName: "",
      category: "Combustible",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      isAnomaly: false,
      anomalyReason: ""
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Gastos y Egresos</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Control de costos operativos, pagos a proveedores y detección automática de anomalías.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Registrar Gasto
        </Button>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-bg-base)", borderLeft: "4px solid var(--color-warning)" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>GASTOS REGISTRADOS DEL FILTRO</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }} className="tabular-nums">
            {formatCurrency(totalExpenseAmount, currentOrg?.currency, currentOrg?.currencySymbol)}
          </div>
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          {filteredExpenses.length} comprobantes cargados
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por categoría, proveedor o detalle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setCategoryFilter("all")}
            style={{
              border: "none",
              backgroundColor: categoryFilter === "all" ? "var(--color-primary-light)" : "transparent",
              color: categoryFilter === "all" ? "var(--color-primary-text)" : "var(--color-text-secondary)",
              fontWeight: categoryFilter === "all" ? 700 : 500,
              fontSize: "0.8125rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-md)",
              cursor: "pointer"
            }}
          >
            Todas
          </button>
          {categories.slice(0, 4).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                border: "none",
                backgroundColor: categoryFilter === cat ? "var(--color-primary-light)" : "transparent",
                color: categoryFilter === cat ? "var(--color-primary-text)" : "var(--color-text-secondary)",
                fontWeight: categoryFilter === cat ? 700 : 500,
                fontSize: "0.8125rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Fecha</th>
              <th style={{ padding: "0.75rem 1rem" }}>Categoría</th>
              <th style={{ padding: "0.75rem 1rem" }}>Proveedor</th>
              <th style={{ padding: "0.75rem 1rem" }}>Descripción</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Monto</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No se encontraron gastos en este período.
                </td>
              </tr>
            ) : (
              filteredExpenses.map(exp => (
                <tr
                  key={exp.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    {formatDate(exp.date)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="badge badge-neutral">{exp.category}</span>
                      {exp.isAnomaly && (
                        <span className="badge badge-warning" title={exp.anomalyReason || "Anomalía"}>
                          <AlertCircle size={10} /> +18%
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {exp.supplierName || "Varios"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", maxWidth: "300px" }}>
                    {exp.description}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--color-danger-text)" }} className="tabular-nums">
                    -{formatCurrency(exp.amount, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.25rem" }}
                      title="Eliminar gasto"
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
          title="Registrar Gasto"
          subtitle="Cargar nuevo comprobante de egreso o costo operativo"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={formData.amount <= 0}>
                Guardar Gasto
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Categoría del Gasto *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Proveedor (Opcional)
                </label>
                <select
                  value={formData.supplierId}
                  onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                >
                  <option value="">-- Sin proveedor / Varios --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Monto Total ($) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount || ""}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Descripción o Concepto
              </label>
              <input
                type="text"
                placeholder="Ej: Carga combustible choferes semana 3"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
