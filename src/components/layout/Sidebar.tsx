import React from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  TrendingUp,
  Users,
  Building2,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Package,
  FolderOpen,
  CheckSquare,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  ShieldCheck
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";

export type NavSection =
  | "dashboard"
  | "my-day"
  | "sales"
  | "customers"
  | "quotes"
  | "products"
  | "suppliers"
  | "receivables"
  | "payables"
  | "expenses"
  | "tasks"
  | "documents"
  | "analysis"
  | "director-ia"
  | "import-csv"
  | "audit"
  | "settings";

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

interface NavGroup {
  label: string;
  items: {
    id: NavSection;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: "danger" | "warning" | "neutral" | "accent";
    highlight?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobile
}) => {
  const { currentOrg, receivables, quotes, tasks } = useOrg();

  const overdueCount = receivables.filter(r => r.status === "overdue").length;
  const pendingTasksCount = tasks.filter(t => t.status === "pending").length;
  const expiringQuotesCount = quotes.filter(q => q.status === "sent").length;

  const navGroups: NavGroup[] = [
    {
      label: "Principal",
      items: [
        { id: "dashboard", label: "Inicio", icon: <LayoutDashboard size={17} /> },
        { id: "my-day", label: "Mi Día", icon: <CalendarCheck size={17} />, badge: overdueCount + pendingTasksCount > 0 ? overdueCount + pendingTasksCount : undefined, badgeColor: "danger", highlight: true }
      ]
    },
    {
      label: "Gestión",
      items: [
        { id: "sales", label: "Ventas", icon: <TrendingUp size={17} /> },
        { id: "customers", label: "Clientes", icon: <Users size={17} /> },
        { id: "quotes", label: "Presupuestos", icon: <FileSpreadsheet size={17} />, badge: expiringQuotesCount > 0 ? expiringQuotesCount : undefined, badgeColor: "warning" },
        { id: "products", label: "Productos", icon: <Package size={17} /> },
        { id: "suppliers", label: "Proveedores", icon: <Building2 size={17} /> }
      ]
    },
    {
      label: "Finanzas",
      items: [
        { id: "receivables", label: "Cobros", icon: <ArrowDownRight size={17} />, badge: overdueCount > 0 ? overdueCount : undefined, badgeColor: "danger" },
        { id: "payables", label: "Pagos", icon: <ArrowUpRight size={17} /> },
        { id: "expenses", label: "Gastos", icon: <Receipt size={17} /> }
      ]
    },
    {
      label: "Organización",
      items: [
        { id: "tasks", label: "Tareas", icon: <CheckSquare size={17} />, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
        { id: "documents", label: "Documentos", icon: <FolderOpen size={17} /> }
      ]
    },
    {
      label: "Inteligencia",
      items: [
        { id: "analysis", label: "Análisis", icon: <BarChart3 size={17} /> },
        { id: "director-ia", label: "Director IA", icon: <Bot size={17} />, badge: "IA", badgeColor: "accent" }
      ]
    },
    {
      label: "Configuración",
      items: [
        { id: "import-csv", label: "Importar CSV", icon: <UploadCloud size={17} /> },
        { id: "audit", label: "Auditoría", icon: <ShieldCheck size={17} /> },
        { id: "settings", label: "Configuración", icon: <Settings size={17} /> }
      ]
    }
  ];

  return (
    <aside
      style={{
        width: isMobileDrawer ? "280px" : (collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)"),
        backgroundColor: "#ffffff",
        borderRight: "1px solid var(--color-border-default)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width 0.2s ease",
        zIndex: 50
      }}
    >
      <div
        style={{
          height: "var(--header-height)",
          padding: "0 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: (collapsed && !isMobileDrawer) ? "center" : "space-between",
          borderBottom: "1px solid var(--color-border-subtle)"
        }}
      >
        {(!collapsed || isMobileDrawer) && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "5px",
                backgroundColor: "var(--color-primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.8125rem"
              }}
            >
              D
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                Direx
              </span>
            </div>
          </div>
        )}

        {!isMobileDrawer && (
          <button
            onClick={onToggleCollapse}
            style={{
              background: "none",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "0.25rem",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              display: "flex"
            }}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {navGroups.map(group => (
          <div key={group.label}>
            {(!collapsed || isMobileDrawer) && (
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                  padding: "0.25rem 0.6rem 0.4rem",
                  letterSpacing: "0.05em"
                }}
              >
                {group.label}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {group.items.map(item => {
                const isActive = currentSection === item.id;
                let badgeStyle = {
                  backgroundColor: "var(--color-bg-muted)",
                  color: "var(--color-text-secondary)"
                };

                if (item.badgeColor === "danger") {
                  badgeStyle = { backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger-text)" };
                } else if (item.badgeColor === "warning") {
                  badgeStyle = { backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning-text)" };
                } else if (item.badgeColor === "accent") {
                  badgeStyle = { backgroundColor: "var(--color-accent-light)", color: "var(--color-accent-text)" };
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectSection(item.id);
                      if (isMobileDrawer && onCloseMobile) onCloseMobile();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: (collapsed && !isMobileDrawer) ? "center" : "space-between",
                      padding: "0.5rem 0.6rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      backgroundColor: isActive ? "var(--color-primary-light)" : "transparent",
                      color: isActive ? "var(--color-primary-text)" : "var(--color-text-secondary)",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.12s ease",
                      position: "relative"
                    }}
                    title={(collapsed && !isMobileDrawer) ? item.label : undefined}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ color: isActive ? "var(--color-accent)" : "currentColor", display: "flex" }}>
                        {item.icon}
                      </div>
                      {(!collapsed || isMobileDrawer) && (
                        <span style={{ fontSize: "0.8125rem" }}>{item.label}</span>
                      )}
                    </div>

                    {(!collapsed || isMobileDrawer) && item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "var(--radius-sm)",
                          ...badgeStyle
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {(!collapsed || isMobileDrawer) && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--color-border-subtle)", backgroundColor: "var(--color-bg-base)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {currentOrg?.name || "Empresa"}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
            CUIT: {currentOrg?.taxId || "30-11223344-5"}
          </div>
        </div>
      )}
    </aside>
  );
};
