import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  ArrowUpDown,
  Phone,
  Mail,
  Building,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Customer } from "../../types";
import { formatCurrency, formatDate } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Drawer } from "../ui/Drawer";
import { useToast } from "../ui/Toast";

export const CustomersView: React.FC = () => {
  const { customers, createCustomer, updateCustomer, deleteCustomer, hasPermission } = useOrg();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (c.taxId && c.taxId.includes(searchTerm));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createCustomer({
      name: name.trim(),
      taxId: taxId.trim() || undefined,
      email: email.trim() || "",
      phone: phone.trim() || "",
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "active",
      totalSpent: 0,
      totalPendingDebt: 0
    });

    setName("");
    setTaxId("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setIsNewModalOpen(false);
    showToast("Cliente registrado exitosamente");
  };

  const getStatusBadge = (status: Customer["status"]) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Activo</span>;
      case "at_risk":
        return <span className="badge badge-warning">En Riesgo</span>;
      case "overdue":
        return <span className="badge badge-danger">En Mora</span>;
      case "inactive":
        return <span className="badge badge-neutral">Inactivo</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={22} style={{ color: "var(--color-accent)" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              Clientes ({customers.length})
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            Gestión comercial, frecuencia de compra y estado crediticio
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsNewModalOpen(true)}
        >
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", padding: "0.875rem 1.25rem" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o CUIT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Estado:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "0.45rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.8125rem" }}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="at_risk">En Riesgo</option>
            <option value="overdue">En Mora</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Facturado Total</th>
              <th style={{ textAlign: "right" }}>Saldo Deudor</th>
              <th style={{ textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                  No se encontraron clientes que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(c => (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} style={{ cursor: "pointer" }}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{c.name}</div>
                    {c.taxId && <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>CUIT: {c.taxId}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8125rem" }}>{c.email || "-"}</div>
                    {c.phone && <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{c.phone}</div>}
                  </td>
                  <td>{getStatusBadge(c.status)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }} className="tabular-nums">
                    {formatCurrency(c.totalSpent)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: c.totalPendingDebt > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" }} className="tabular-nums">
                    {formatCurrency(c.totalPendingDebt)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Button variant="ghost" size="sm">Ver ficha →</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer de Detalle del Cliente */}
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
                onClick={async () => {
                  await deleteCustomer(selectedCustomer.id);
                  setSelectedCustomer(null);
                  showToast("Cliente eliminado.");
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>COMPRAS TOTALES</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }} className="tabular-nums">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </div>
              </div>
              <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>DEUDA PENDIENTE</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: selectedCustomer.totalPendingDebt > 0 ? "var(--color-danger-text)" : "var(--color-success-text)" }} className="tabular-nums">
                  {formatCurrency(selectedCustomer.totalPendingDebt)}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>Datos de Contacto</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.8125rem" }}>
                <div><strong>Email:</strong> {selectedCustomer.email || "No registrado"}</div>
                <div><strong>Teléfono:</strong> {selectedCustomer.phone || "No registrado"}</div>
                <div><strong>Dirección:</strong> {selectedCustomer.address || "No registrada"}</div>
                <div><strong>Identificación Fiscal:</strong> {selectedCustomer.taxId || "Sin CUIT"}</div>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Modal Nuevo Cliente */}
      {isNewModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewModalOpen(false)}
          title="Registrar Nuevo Cliente"
          subtitle="Añadí una cuenta comercial a tu empresa"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsNewModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateCustomer} disabled={!name.trim()}>
                Guardar Cliente
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateCustomer} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Razón Social / Nombre *
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="Ej: Ferretería Central S.R.L."
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  CUIT / Tax ID
                </label>
                <input
                  type="text"
                  placeholder="30-71888999-4"
                  value={taxId}
                  onChange={e => setTaxId(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="11-4455-6677"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="contacto@ferreteriacentral.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
