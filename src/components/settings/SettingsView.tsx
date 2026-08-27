import React, { useState } from 'react';
import { Settings, Building, Users, RefreshCw, Key, Shield, AlertCircle, UserPlus, ShieldAlert } from 'lucide-react';
import { PlanLimitsService } from '../../lib/subscription/planLimits';
import { supabase } from '../../lib/supabase/client';
import { useOrg } from '../../context/OrgContext';
import { Button } from '../ui/Button';

export const SettingsView: React.FC = () => {
  const { currentOrg, resetDemoData, createNewOrganization, currentUser } = useOrg();
  const [newOrgName, setNewOrgName] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string>("founder");
  const [subStatus, setSubStatus] = useState<string>("trialing");
  const [membersCount, setMembersCount] = useState<number>(1);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (!currentOrg?.id) return;
    let isMounted = true;
    async function loadPlanAndMembers() {
      try {
        if (supabase) {
          // Consultar suscripción
          const { data: subData } = await supabase
            .from("organization_subscriptions")
            .select("plan_id, status")
            .eq("organization_id", currentOrg?.id || "")
            .maybeSingle();

          if (isMounted && subData) {
            setCurrentPlanId(subData.plan_id || "founder");
            setSubStatus(subData.status || "trialing");
          }

          // Consultar conteo de miembros
          const { count } = await supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", currentOrg?.id || "");

          if (isMounted && typeof count === "number") {
            setMembersCount(count);
          }
        }
      } catch (_e) {}
    }
    loadPlanAndMembers();
    return () => { isMounted = false; };
  }, [currentOrg?.id]);

  const memberLimitCheck = PlanLimitsService.canAddMember(membersCount, currentPlanId, subStatus);

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

      {/* Miembros del Equipo y Límites del Plan */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
            Miembros del Equipo
          </h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: memberLimitCheck.allowed ? '#dcfce7' : '#fee2e2', color: memberLimitCheck.allowed ? '#166534' : '#991b1b' }}>
            {membersCount} de {memberLimitCheck.maxAllowed} usuarios
          </span>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Administrá el acceso a la empresa según las cuotas incluidas en tu plan.
        </p>

        {!memberLimitCheck.allowed && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{memberLimitCheck.reason}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!memberLimitCheck.allowed) return;
            setInviteMsg({ type: 'success', text: 'Invitación enviada a ' + inviteEmail });
            setInviteEmail('');
          }}
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
        >
          <input
            type="email"
            placeholder="colaborador@empresa.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            disabled={!memberLimitCheck.allowed}
            style={{ flex: 1, minWidth: '220px', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as any)}
            disabled={!memberLimitCheck.allowed}
            style={{ padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}
          >
            <option value="member">Miembro Operativo</option>
            <option value="admin">Administrador</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!memberLimitCheck.allowed || !inviteEmail.trim()}
            icon={<UserPlus size={14} />}
          >
            Invitar Miembro
          </Button>
        </form>

        {inviteMsg && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: inviteMsg.type === 'success' ? '#166534' : '#991b1b', fontWeight: 600 }}>
            {inviteMsg.text}
          </div>
        )}
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
