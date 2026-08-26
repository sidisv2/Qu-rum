import React, { useState } from 'react';
import { Settings, Building, Users, RefreshCw, Key, Shield } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { Button } from '../ui/Button';

export const SettingsView: React.FC = () => {
  const { currentOrg, resetDemoData, createNewOrganization } = useOrg();
  const [newOrgName, setNewOrgName] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [isCreated, setIsCreated] = useState(false);

  const handleCreateNewOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    createNewOrganization(newOrgName, newTaxId, newIndustry || 'General');
    setIsCreated(true);
    setNewOrgName('');
    setNewTaxId('');
    setNewIndustry('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Configuración</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Parámetros de empresa, aislamiento multi-tenant y preferencias del sistema.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={18} style={{ color: 'var(--color-primary)' }} />
          Empresa Activa
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div><strong>Razón Social:</strong> {currentOrg?.name}</div>
          <div><strong>Identificación Fiscal:</strong> {currentOrg?.taxId}</div>
          <div><strong>Moneda Operativa:</strong> {currentOrg?.currency} ({currentOrg?.currencySymbol})</div>
          <div><strong>ID Organización:</strong> <code>{currentOrg?.id}</code></div>
        </div>
      </div>

      {/* Multi-tenant Org Switcher / Creator */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Crear Nueva Organización (Aislamiento Multi-Tenant)
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Podés crear un nuevo entorno completamente independiente con base de datos en blanco.
        </p>

        <form onSubmit={handleCreateNewOrg} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              Nombre de la nueva empresa *
            </label>
            <input
              type="text"
              required
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              placeholder="Ej: Metalúrgica Industrial S.A."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                CUIT / Identificador Fiscal
              </label>
              <input
                type="text"
                value={newTaxId}
                onChange={e => setNewTaxId(e.target.value)}
                placeholder="30-..."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                Rubro / Industria
              </label>
              <input
                type="text"
                value={newIndustry}
                onChange={e => setNewIndustry(e.target.value)}
                placeholder="Manufactura, Servicios, etc."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>
          </div>

          <div>
            <Button variant="primary" size="sm" type="submit" disabled={!newOrgName.trim()}>
              Crear y Cambiar a esta Empresa
            </Button>
          </div>
        </form>
      </div>

      {/* Demo Reset */}
      <div className="card" style={{ borderColor: 'var(--color-border-default)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Restablecer Datos de Demostración
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Reinicia la base de datos local con el escenario realista completo de demostración.
        </p>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={resetDemoData}>
          Restablecer Empresa Demo
        </Button>
      </div>
    </div>
  );
};
