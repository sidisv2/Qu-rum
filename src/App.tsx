import React, { useState, useEffect } from "react";
import { getSectionFromPath, getPathFromSection } from "./lib/navigation/routes";
import { AuthProvider } from "./context/AuthContext";
import { OrgProvider, useOrg } from "./context/OrgContext";
import { ToastProvider } from "./components/ui/Toast";
import { RequireAuth } from "./components/auth/RequireAuth";
import { Sidebar, NavSection } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardView } from "./components/dashboard/DashboardView";
import { MyDayView } from "./components/my-day/MyDayView";
import { SalesView } from "./components/sales/SalesView";
import { CustomersView } from "./components/customers/CustomersView";
import { ExpensesView } from "./components/expenses/ExpensesView";
import { ReceivablesView } from "./components/receivables/ReceivablesView";
import { PayablesView } from "./components/payables/PayablesView";
import { QuotesView } from "./components/quotes/QuotesView";
import { ProductsView } from "./components/products/ProductsView";
import { SuppliersView } from "./components/suppliers/SuppliersView";
import { DocumentsView } from "./components/documents/DocumentsView";
import { TasksView } from "./components/tasks/TasksView";
import { AnalysisView } from "./components/analysis/AnalysisView";
import { DirectorIAView } from "./components/director-ia/DirectorIAView";
import { ImportCSVView } from "./components/import-csv/ImportCSVView";
import { AuditView } from "./components/audit/AuditView";
import { SettingsView } from "./components/settings/SettingsView";
import { SmartCollectionsView } from "./components/collections/SmartCollectionsView";
import { BetaMonitoringView } from "./components/monitoring/BetaMonitoringView";
import { SubscriptionView } from "./components/subscription/SubscriptionView";
import { SupportView } from "./components/support/SupportView";
import { LegalView } from "./components/legal/LegalView";
import { FeedbackWidget } from "./components/feedback/FeedbackWidget";
import { Analytics } from "@vercel/analytics/react";

// Simple robust Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem", textAlign: "center" }}>
          <div style={{ maxWidth: "450px", backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", border: "1px solid var(--color-border-default)", boxShadow: "var(--shadow-md)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-danger-text)", marginBottom: "0.5rem" }}>
              Algo no cargó correctamente
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
              Direx encontró un inconveniente al cargar esta sección. Hacé click en el botón para reintentar.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#ffffff",
                border: "none",
                padding: "0.6rem 1.25rem",
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AppContent: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>(() => {
    if (typeof window !== "undefined") {
      return getSectionFromPath(window.location.pathname);
    }
    return "dashboard";
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentSection(getSectionFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToSection = (section: NavSection) => {
    setCurrentSection(section);
    if (typeof window !== "undefined") {
      const targetPath = getPathFromSection(section);
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, "", targetPath);
      }
    }
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderCurrentView = () => {
    switch (currentSection) {
      case "dashboard":
        return (
          <DashboardView
            onNavigateToSection={navigateToSection}
            onOpenQuickSale={() => setCurrentSection("sales")}
            onOpenQuickExpense={() => setCurrentSection("expenses")}
          />
        );
      case "my-day":
        return <MyDayView onNavigateToSection={navigateToSection} />;
      case "smart-collections":
        return <SmartCollectionsView />;
      case "sales":
        return <SalesView />;
      case "customers":
        return <CustomersView />;
      case "quotes":
        return <QuotesView />;
      case "products":
        return <ProductsView />;
      case "suppliers":
        return <SuppliersView />;
      case "receivables":
        return <ReceivablesView />;
      case "payables":
        return <PayablesView />;
      case "expenses":
        return <ExpensesView />;
      case "tasks":
        return <TasksView />;
      case "documents":
        return <DocumentsView />;
      case "analysis":
        return <AnalysisView />;
      case "director-ia":
        return <DirectorIAView />;
      case "import-csv":
        return <ImportCSVView />;
      case "subscription":
        return <SubscriptionView />;
      case "support":
        return <SupportView />;
      case "legal":
        return (
          <LegalView
            initialTab={
              typeof window !== "undefined" && window.location.pathname.includes("privacidad")
                ? "privacy"
                : "terms"
            }
            onBack={() => navigateToSection("dashboard")}
          />
        );
      case "beta-monitoring":
        return <BetaMonitoringView />;
      case "audit":
        return <AuditView />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateToSection={navigateToSection}
            onOpenQuickSale={() => setCurrentSection("sales")}
            onOpenQuickExpense={() => setCurrentSection("expenses")}
          />
        );
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "var(--color-bg-base)" }}>
      {/* Desktop Sidebar */}
      <div style={{ display: "flex", height: "100%" }}>
        <Sidebar
          currentSection={currentSection}
          onSelectSection={navigateToSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            zIndex: 100,
            display: "flex"
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ height: "100%" }}>
            <Sidebar
              currentSection={currentSection}
              onSelectSection={navigateToSection}
              collapsed={false}
              onToggleCollapse={() => {}}
              isMobileDrawer={true}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden" }}>
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateToSection={navigateToSection}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          <ErrorBoundary>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* In-App Floating Feedback Widget */}
      <FeedbackWidget currentView={currentSection} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RequireAuth>
          <OrgProvider>
            <ToastProvider>
              <AppContent />
              <Analytics />
            </ToastProvider>
          </OrgProvider>
        </RequireAuth>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
