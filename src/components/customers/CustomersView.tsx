import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Customer, CustomerStatus } from "../../types";
import { formatCurrency, formatDate } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const CustomersView: React.FC = () => {
  const { customers, createCustomer, deleteCustomer, currentOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    taxId: "",
    address: "",
    status: "active" as CustomerStatus,
    notes: "",
    totalSpent: 0,
    totalPendingDebt: 0
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createCustomer({
      ...formData,
      totalSpent: Number(formData.totalSpent) || 0,
      totalPendingDebt: Number(formData.totalPendingDebt) || 0
    });
    setIsCreateOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      taxId: "",
      address: "",
      status: "active",
      notes: "",
      totalSpent: 0,
      totalPendingDebt: 0
    });
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case "active": return <span className="badge badge-success">Activo</span>;
      case "at_risk": return <span className="badge badge-warning">En riesgo</span>;
      case "overdue": return <span className="badge badge-danger">Moroso</span>;
      case "inactive": return <span className="badge badge-neutral">Inactivo</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>Clientes</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Base centralizada de cuentas comerciales, historial y estado crediticio.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nuevo Cliente
        </Button>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "active", "at_risk", "overdue"] as const).map(s => (
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
              {s === "all" ? "Todos" : s === "active" ? "Activos" : s === "at_risk" ? "En riesgo" : "Morosos"}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Cliente</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
              <th style={{ padding: "0.75rem 1rem" }}>Contacto</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total Facturado</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Saldo Deuda</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No se encontraron clientes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => (
                <tr
                  key={cust.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.875rem" }}>{cust.name}</div>
                    {cust.taxId && <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>CUIT: {cust.taxId}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{getStatusBadge(cust.status)}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    <div>{cust.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{cust.phone}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }} className="tabular-nums">
                    {formatCurrency(cust.totalSpent, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: cust.totalPendingDebt > 0 ? "var(--color-danger-text)" : "var(--color-text-secondary)" }} className="tabular-nums">
                    {formatCurrency(cust.totalPendingDebt, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      Ver Ficha
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          subtitle={"Ficha de Cliente — Registrado el " + formatDate(selectedCustomer.createdAt)}
          footer={
            <>
              <Button variant="danger" size="sm" onClick={() => { deleteCustomer(selectedCustomer.id); setSelectedCustomer(null); }}>
                Eliminar Cliente
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                Cerrar
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", backgroundColor: "var(--color-bg-base)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>TOTAL FACTURADO</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }} className="tabular-nums">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>DEUDA PENDIENTE</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: selectedCustomer.totalPendingDebt > 0 ? "var(--color-danger-text)" : "var(--color-success-text)" }} className="tabular-nums">
                  {formatCurrency(selectedCustomer.totalPendingDebt)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <div><strong>Email:</strong> {selectedCustomer.email || "-"}</div>
              <div><strong>Teléfono:</strong> {selectedCustomer.phone || "-"}</div>
              <div><strong>Dirección:</strong> {selectedCustomer.address || "-"}</div>
              <div><strong>Frecuencia habitual:</strong> Cada {selectedCustomer.purchaseFrequencyDays || 30} días</div>
              <div><strong>Notas comerciales:</strong> {selectedCustomer.notes || "Sin notas."}</div>
            </div>
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Nuevo Cliente"
          subtitle="Registrar nueva cuenta comercial en el sistema"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit}>
                Guardar Cliente
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Nombre / Razón Social *
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Notas iniciales
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", minHeight: "60px" }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
