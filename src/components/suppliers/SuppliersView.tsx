import React, { useState } from 'react';
import { Plus, Search, Building2, Phone, Mail, Trash2 } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { Supplier } from '../../types';
import { formatCurrency } from '../../lib/utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const SuppliersView: React.FC = () => {
  const { suppliers, createSupplier, deleteSupplier, currentOrg } = useOrg();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    category: 'Materia Prima',
    notes: '',
    totalPaid: 0,
    pendingPayment: 0
  });

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createSupplier({
      ...formData,
      totalPaid: Number(formData.totalPaid) || 0,
      pendingPayment: Number(formData.pendingPayment) || 0
    });
    setIsCreateOpen(false);
    setFormData({ name: '', contactName: '', email: '', phone: '', category: 'Materia Prima', notes: '', totalPaid: 0, pendingPayment: 0 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Proveedores</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Directorio de suministros, compras acumuladas y condiciones comerciales.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nuevo Proveedor
        </Button>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
        <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar por empresa proveedora, contacto o rubro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem' }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Proveedor</th>
              <th style={{ padding: '0.75rem 1rem' }}>Rubro</th>
              <th style={{ padding: '0.75rem 1rem' }}>Contacto</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Pagado</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Saldo Pendiente</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No se encontraron proveedores.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map(sup => (
                <tr
                  key={sup.id}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {sup.name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-neutral">{sup.category}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    <div>{sup.contactName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sup.email}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }} className="tabular-nums">
                    {formatCurrency(sup.totalPaid, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: sup.pendingPayment > 0 ? 'var(--color-warning-text)' : 'var(--color-text-secondary)' }} className="tabular-nums">
                    {formatCurrency(sup.pendingPayment, currentOrg?.currency, currentOrg?.currencySymbol)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => deleteSupplier(sup.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
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
          title="Nuevo Proveedor"
          subtitle="Registrar nuevo proveedor comercial"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={!formData.name.trim()}>
                Guardar Proveedor
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Razón Social / Proveedor *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Rubro / Categoría
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
