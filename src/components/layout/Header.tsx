import React, { useState } from "react";
import { Building, ChevronDown, Bell, CheckCircle2, Menu, LogIn, UserPlus, LogOut, User as UserIcon } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../auth/AuthModal";
import { NavSection } from "./Sidebar";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onNavigateToSection?: (section: NavSection) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { currentOrg, organizations, setCurrentOrg } = useOrg();
  const { user, isAuthenticated, signOut } = useAuth();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "1",
      title: "Cobro pendiente prioritario",
      message: "Construcciones Norte S.A. tiene un saldo de $4.500.000 vencido.",
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ]);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const openAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setAuthDropdownOpen(false);
  };

  return (
    <header
      style={{
        height: "var(--header-height)",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid var(--color-border-default)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 40
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onToggleMobileMenu}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            display: "none",
            padding: "0.25rem"
          }}
          className="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>

        {/* Selector de Organización */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "none",
              border: "1px solid var(--color-border-default)",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-text-primary)"
            }}
          >
            <Building size={14} style={{ color: "var(--color-accent)" }} />
            <span>{currentOrg ? currentOrg.name : "Seleccionar Empresa"}</span>
            <ChevronDown size={12} style={{ color: "var(--color-text-muted)" }} />
          </button>

          {orgDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "0.25rem",
                width: "220px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 100,
                padding: "0.4rem 0"
              }}
            >
              {organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => {
                    setCurrentOrg(org);
                    setOrgDropdownOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    border: "none",
                    background: org.id === currentOrg?.id ? "var(--color-bg-base)" : "transparent",
                    fontSize: "0.8125rem",
                    fontWeight: org.id === currentOrg?.id ? 700 : 500,
                    color: "var(--color-text-primary)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>{org.name}</span>
                  {org.id === currentOrg?.id && <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Notificaciones */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              background: "none",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              padding: "0.4rem",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "14px",
                  height: "14px",
                  backgroundColor: "var(--color-danger)",
                  color: "#ffffff",
                  fontSize: "0.625rem",
                  fontWeight: 800,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.5rem",
                width: "300px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 100,
                padding: "0.75rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Notificaciones</span>
                <button
                  onClick={markAllNotificationsAsRead}
                  style={{ background: "none", border: "none", fontSize: "0.6875rem", color: "var(--color-accent)", cursor: "pointer" }}
                >
                  Marcar leídas
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem 0" }}>
                    No tenés notificaciones
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: "0.4rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: n.isRead ? "transparent" : "var(--color-bg-base)",
                        fontSize: "0.75rem"
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                      <div style={{ color: "var(--color-text-muted)" }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menú de Autenticación / Perfil */}
        <div style={{ position: "relative" }}>
          {isAuthenticated && user ? (
            <button
              onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "1px solid var(--color-border-default)",
                padding: "0.3rem 0.6rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary, #4f46e5)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700
                }}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {user.fullName || user.email}
              </span>
              <ChevronDown size={12} style={{ color: "var(--color-text-muted)" }} />
            </button>
          ) : (
            <button
              onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "var(--color-primary, #4f46e5)",
                color: "#ffffff",
                border: "none",
                padding: "0.45rem 0.85rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 700
              }}
            >
              <UserIcon size={14} />
              <span>Acceder</span>
              <ChevronDown size={12} />
            </button>
          )}

          {authDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.4rem",
                width: "190px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 100,
                padding: "0.35rem 0"
              }}
            >
              {isAuthenticated && user ? (
                <>
                  <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--color-border-default)", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    Conectado como<br />
                    <strong style={{ color: "var(--color-text-primary)" }}>{user.email}</strong>
                  </div>
                  <button
                    onClick={() => { signOut(); setAuthDropdownOpen(false); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      background: "none",
                      fontSize: "0.8125rem",
                      color: "var(--color-danger, #ef4444)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <LogOut size={14} />
                    <span>Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal("login")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      background: "none",
                      fontSize: "0.8125rem",
                      color: "var(--color-text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <LogIn size={14} style={{ color: "var(--color-primary, #4f46e5)" }} />
                    <span>Iniciar sesión</span>
                  </button>
                  <button
                    onClick={() => openAuthModal("register")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      background: "none",
                      fontSize: "0.8125rem",
                      color: "var(--color-text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <UserPlus size={14} style={{ color: "#16a34a" }} />
                    <span>Crear cuenta</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </header>
  );
};
