import React from 'react';
import { ShieldCheck, History, User } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { formatDate } from '../../lib/utils/formatters';

export const AuditView: React.FC = () => {
  const { auditLogs, currentOrg } = useOrg();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
          Registro de Auditoría y Seguridad
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Trazabilidad inmutable de todas las acciones operativas, cambios y ejecuciones de IA en <strong>{currentOrg?.name}</strong>.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Fecha y Hora</th>
              <th style={{ padding: '0.75rem 1rem' }}>Usuario / Agente</th>
              <th style={{ padding: '0.75rem 1rem' }}>Acción</th>
              <th style={{ padding: '0.75rem 1rem' }}>Entidad</th>
              <th style={{ padding: '0.75rem 1rem' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr
                key={log.id}
                style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.8125rem' }}
              >
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} className="tabular-nums">
                  {new Date(log.timestamp).toLocaleString('es-AR')}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: log.userName.includes('IA') ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {log.userName}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                  {log.action}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span className="badge badge-neutral">{log.entityType}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
