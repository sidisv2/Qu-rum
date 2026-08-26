import React, { useState } from "react";
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
import { ToastProvider } from "./components/ui/Toast";

export const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderCurrentView = () => {
    switch (currentSection) {
      case "dashboard":
        return (
          <DashboardView
            onNavigateToSection={setCurrentSection}
            onOpenQuickSale={() => setCurrentSection("sales")}
            onOpenQuickExpense={() => setCurrentSection("expenses")}
          />
        );
      case "my-day":
        return <MyDayView onNavigateToSection={setCurrentSection} />;
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
      case "audit":
        return <AuditView />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateToSection={setCurrentSection}
            onOpenQuickSale={() => setCurrentSection("sales")}
            onOpenQuickExpense={() => setCurrentSection("expenses")}
          />
        );
    }
  };

  return (
    <ToastProvider>
      <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "var(--color-bg-base)" }}>
        {/* Desktop Sidebar */}
        <div style={{ display: "flex", height: "100%" }}>
          <Sidebar
            currentSection={currentSection}
            onSelectSection={setCurrentSection}
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
                onSelectSection={setCurrentSection}
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
            onNavigateToSection={setCurrentSection}
          />
          <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;
