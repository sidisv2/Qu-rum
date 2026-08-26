import React, { useState } from "react";
import { Plus, Search, Eye, Phone, Mail, MapPin, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Customer, CustomerStatus } from "../../types";
import { formatCurrency, formatDate } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Drawer } from "../ui/Drawer";
import { useToast } from "../ui/Toast";

export const CustomersView: React.FC = () => {
  const { customers, createCustomer, deleteCustomer, currentOrg } = useOrg();
  const { showToast } = useToast();
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
    showToast("Cliente registrado correctamente");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Clientes
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            Base de cuentas comerciales, historial de compra y estado de deuda.
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

      {/* 2. Barra de Búsqueda y Filtros Rápidos */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)", padding: "0.45rem 0.75rem", borderRadius: "var(--radius-md)" }}>
          <Search size={15} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email, CUIT o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.8125rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["all", "active", "at_risk", "overdue"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                border: "1px solid",
                borderColor: statusFilter === s ? "var(--color-primary)" : "var(--color-border-default)",
                backgroundColor: statusFilter === s ? "var(--color-primary-light)" : "#ffffff",
                color: statusFilter === s ? "var(--color-primary-text)" : "var(--color-text-secondary)",
                fontWeight: statusFilter === s ? 700 : 500,
                fontSize: "0.75rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer"
              }}
            >
              {s === "all" ? "Todos (" + customers.length + ")" : s === "active" ? "Activos" : s === "at_risk" ? "En riesgo" : "Morosos"}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tabla Adaptativa de Clientes */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Cliente / Razón Social</th>
              <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
              <th style={{ padding: "0.75rem 1rem" }}>Contacto</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Facturado Total</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Saldo Deudor</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>
                    No se encontraron clientes con el filtro seleccionado.
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => (
                <tr
                  key={cust.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)", cursor: "pointer", transition: "background-color 0.12s ease" }}
                  onClick={() => setSelectedCustomer(cust)}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.875rem" }}>{cust.name}</div>
                    {cust.taxId && <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>CUIT: {cust.taxId}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{getStatusBadge(cust.status)}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    <div>{cust.email || "-"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{cust.phone || "-"}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }} className="tabular-nums">
                    {formatCurrency(cust.totalSpent, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: cust.totalPendingDebt > 0 ? "var(--color-danger-text)" : "var(--color-text-secondary)" }} className="tabular-nums">
                    {formatCurrency(cust.totalPendingDebt, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(cust)}
                      icon={<Eye size={14} />}
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

      {/* 4. Slide-over Drawer para Ficha Lateral Rápida */}
      {selectedCustomer && (
        <Drawer
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          subtitle={"Registrado el " + formatDate(selectedCustomer.createdAt)}
          footer={
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const ok = deleteCustomer(selectedCustomer.id);
                  if (ok) {
                    setSelectedCustomer(null);
                    showToast("Cliente eliminado.");
                  }
                }}
              >
                Eliminar Cliente
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                Cerrar
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Estado de Cuenta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", backgroundColor: "var(--color-bg-base)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>TOTAL COMPRADO</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "0.2rem" }} className="tabular-nums">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>SALDO DEUDOR</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: selectedCustomer.totalPendingDebt > 0 ? "var(--color-danger-text)" : "var(--color-success-text)", marginTop: "0.2rem" }} className="tabular-nums">
                  {formatCurrency(selectedCustomer.totalPendingDebt)}
                </div>
              </div>
            </div>

            {/* Datos de Contacto */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)" }}>
                <Mail size={15} style={{ color: "var(--color-text-muted)" }} />
                <span>{selectedCustomer.email || "Sin email"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)" }}>
                <Phone size={15} style={{ color: "var(--color-text-muted)" }} />
                <span>{selectedCustomer.phone || "Sin teléfono"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)" }}>
                <MapPin size={15} style={{ color: "var(--color-text-muted)" }} />
                <span>{selectedCustomer.address || "Sin dirección"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)" }}>
                <Calendar size={15} style={{ color: "var(--color-text-muted)" }} />
                <span>Frecuencia de compra habitual: cada {selectedCustomer.purchaseFrequencyDays || 30} días</span>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div style={{ backgroundColor: "var(--color-bg-base)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>NOTAS COMERCIALES:</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{selectedCustomer.notes}</div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* 5. Modal de Creación */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Nuevo Cliente"
          subtitle="Registrar cuenta comercial en el sistema"
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
                autoFocus
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
                Notas comerciales
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
