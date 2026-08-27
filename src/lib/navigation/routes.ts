import { NavSection } from "../../components/layout/Sidebar";

export const SECTION_TO_PATH: Record<NavSection, string> = {
  "dashboard": "/dashboard",
  "my-day": "/mi-dia",
  "smart-collections": "/cobros-smart",
  "sales": "/operaciones/ventas",
  "customers": "/operaciones/clientes",
  "quotes": "/operaciones/presupuestos",
  "products": "/operaciones/productos",
  "suppliers": "/operaciones/proveedores",
  "receivables": "/finanzas/cobros",
  "payables": "/finanzas/pagos",
  "expenses": "/finanzas/gastos",
  "tasks": "/organizacion/tareas",
  "documents": "/organizacion/documentos",
  "analysis": "/inteligencia/analisis",
  "director-ia": "/inteligencia/director-ia",
  "subscription": "/configuracion/mi-plan",
  "import-csv": "/configuracion/importar-csv",
  "beta-monitoring": "/configuracion/monitoreo-beta",
  "audit": "/configuracion/auditoria",
  "settings": "/configuracion/empresa",
  "support": "/soporte",
  "legal": "/terminos"
};

export const PATH_TO_SECTION: Record<string, NavSection> = Object.entries(SECTION_TO_PATH).reduce(
  (acc, [section, path]) => {
    acc[path] = section as NavSection;
    return acc;
  },
  {
    "/": "dashboard",
    "/gestion-cobros": "smart-collections",
    "/cobros": "receivables",
    "/ventas": "sales",
    "/clientes": "customers",
    "/gastos": "expenses",
    "/director-ia": "director-ia",
    "/subscription": "subscription",
    "/pricing": "subscription",
    "/soporte": "support",
    "/ayuda": "support",
    "/terminos": "legal",
    "/privacidad": "legal",
    "/legal": "legal",
    "/terminos-y-condiciones": "legal"
  } as Record<string, NavSection>
);

export function getSectionFromPath(pathname: string): NavSection {
  const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return PATH_TO_SECTION[normalized] || "dashboard";
}

export function getPathFromSection(section: NavSection): string {
  return SECTION_TO_PATH[section] || "/dashboard";
}
