import React, { useState } from 'react';
import { Bell, Menu, Plus, RefreshCw, Sparkles, Building } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenQuickSale: () => void;
  onOpenQuickExpense: () => void;
  onNavigateToIA: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenQuickSale,
  onOpenQuickExpense,
  onNavigateToIA
}) => {
  const { currentOrg, currentUser, notifications, markAllNotificationsAsRead, resetDemoData } = useOrg();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleMobileMenu}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            color: 'var(--color-text-secondary)'
          }}
          className="mobile-menu-trigger"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
            {currentOrg?.name || 'Mi Organización'}
          </span>
          {currentOrg?.isDemo && (
            <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
              Datos Demo
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Button
          variant="outline"
          size="sm"
          icon={<Sparkles size={14} />}
          onClick={onNavigateToIA}
        >
          Consultar Director IA
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onOpenQuickExpense}
        >
          Gasto
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onOpenQuickSale}
        >
          Nueva Venta
        </Button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Notificaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border-subtle)',
                overflow: 'hidden',
                zIndex: 100
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Alertas y Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                    No hay alertas pendientes.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: n.isRead ? 'transparent' : 'var(--color-bg-base)',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: n.type === 'danger' ? 'var(--color-danger-text)' : 'var(--color-text-primary)' }}>
                        {n.title}
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar & reset demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--color-border-subtle)' }}>
          <button
            onClick={resetDemoData}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Restablecer datos Demo"
          >
            <RefreshCw size={15} />
          </button>

          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: 'var(--color-primary)'
            }}
          >
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
