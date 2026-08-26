import React from "react";
import {
  LayoutDashboard,
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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UploadCloud
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";

export type NavSection =
  | "dashboard"
  | "sales"
  | "customers"
  | "suppliers"
  | "expenses"
  | "receivables"
  | "payables"
  | "quotes"
  | "products"
  | "documents"
  | "tasks"
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

  const navItems = [
    { id: "dashboard" as NavSection, label: "Inicio", icon: <LayoutDashboard size={18} /> },
    { id: "director-ia" as NavSection, label: "Director IA", icon: <Bot size={18} />, highlight: true },
    { id: "sales" as NavSection, label: "Ventas", icon: <TrendingUp size={18} /> },
    { id: "customers" as NavSection, label: "Clientes", icon: <Users size={18} /> },
    { id: "suppliers" as NavSection, label: "Proveedores", icon: <Building2 size={18} /> },
    { id: "expenses" as NavSection, label: "Gastos", icon: <Receipt size={18} /> },
    { id: "receivables" as NavSection, label: "Cobros", icon: <ArrowDownRight size={18} />, badge: overdueCount > 0 ? overdueCount : undefined, badgeColor: "danger" },
    { id: "payables" as NavSection, label: "Pagos", icon: <ArrowUpRight size={18} /> },
    { id: "quotes" as NavSection, label: "Presupuestos", icon: <FileSpreadsheet size={18} />, badge: quotes.length > 0 ? quotes.length : undefined },
    { id: "products" as NavSection, label: "Productos / Servicios", icon: <Package size={18} /> },
    { id: "documents" as NavSection, label: "Documentos", icon: <FolderOpen size={18} /> },
    { id: "tasks" as NavSection, label: "Tareas", icon: <CheckSquare size={18} />, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: "analysis" as NavSection, label: "Análisis", icon: <BarChart3 size={18} /> },
    { id: "import-csv" as NavSection, label: "Importar CSV", icon: <UploadCloud size={18} /> },
    { id: "audit" as NavSection, label: "Auditoría", icon: <ShieldCheck size={18} /> },
    { id: "settings" as NavSection, label: "Configuración", icon: <Settings size={18} /> }
  ];

  return (
    <aside
      style={{
        width: isMobileDrawer ? "280px" : (collapsed ? "72px" : "256px"),
        backgroundColor: "#ffffff",
        borderRight: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width 0.2s ease",
        zIndex: 50
      }}
    >
      <div
        style={{
          padding: "1.25rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: (collapsed && !isMobileDrawer) ? "center" : "space-between",
          borderBottom: "1px solid var(--color-border-subtle)"
        }}
      >
        {(!collapsed || isMobileDrawer) && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "var(--color-primary)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.875rem"
                }}
              >
                Q
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                Quórum
              </span>
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "170px" }}>
              {currentOrg ? currentOrg.name : "Administración PyME"}
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
              color: "var(--color-text-secondary)"
            }}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: "0.75rem 0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {navItems.map(item => {
            const isActive = currentSection === item.id;
            const badgeClass = item.badgeColor === "danger" ? "badge badge-danger" : "badge badge-neutral";
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
                  padding: "0.625rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  backgroundColor: isActive ? "var(--color-primary-light)" : (item.highlight ? "#f8fafc" : "transparent"),
                  color: isActive ? "var(--color-primary-text)" : "var(--color-text-secondary)",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  outline: "none"
                }}
                title={(collapsed && !isMobileDrawer) ? item.label : undefined}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ color: isActive ? "var(--color-primary)" : "currentColor", display: "flex" }}>
                    {item.icon}
                  </div>
                  {(!collapsed || isMobileDrawer) && (
                    <span style={{ fontSize: "0.875rem" }}>{item.label}</span>
                  )}
                </div>

                {(!collapsed || isMobileDrawer) && item.badge !== undefined && (
                  <span className={badgeClass} style={{ fontSize: "0.6875rem", padding: "0.1rem 0.4rem" }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {(!collapsed || isMobileDrawer) && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--color-border-subtle)", backgroundColor: "var(--color-bg-base)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-success)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              Modo Empresa Activo
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
