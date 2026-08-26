import React, { useState } from 'react';
import { OrgProvider } from './context/OrgContext';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { DashboardView } from './components/dashboard/DashboardView';
import { DirectorIAView } from './components/director-ia/DirectorIAView';
import { CustomersView } from './components/customers/CustomersView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReceivablesView } from './components/receivables/ReceivablesView';
import { PayablesView } from './components/payables/PayablesView';
import { QuotesView } from './components/quotes/QuotesView';
import { ProductsView } from './components/products/ProductsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { DocumentsView } from './components/documents/DocumentsView';
import { TasksView } from './components/tasks/TasksView';
import { AnalysisView } from './components/analysis/AnalysisView';
import { ImportCSVView } from './components/import-csv/ImportCSVView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';

import './styles/main.css';

const MainLayout: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const renderCurrentView = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToSection={(sec) => setCurrentSection(sec)}
            onOpenQuickSale={() => setCurrentSection('sales')}
            onOpenQuickExpense={() => setCurrentSection('expenses')}
          />
        );
      case 'director-ia':
        return <DirectorIAView onNavigateToSection={(sec) => setCurrentSection(sec as NavSection)} />;
      case 'customers':
        return <CustomersView />;
      case 'sales':
        return <SalesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'receivables':
        return <ReceivablesView />;
      case 'payables':
        return <PayablesView />;
      case 'quotes':
        return <QuotesView />;
      case 'products':
        return <ProductsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'documents':
        return <DocumentsView />;
      case 'tasks':
        return <TasksView />;
      case 'analysis':
        return <AnalysisView />;
      case 'import-csv':
        return <ImportCSVView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigateToSection={(sec) => setCurrentSection(sec)} onOpenQuickSale={() => {}} onOpenQuickExpense={() => {}} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--color-bg-base)' }}>
      {/* Desktop Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Drawer (backdrop + sidebar) */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 90
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ height: '100%' }}>
            <Sidebar
              currentSection={currentSection}
              onSelectSection={setCurrentSection}
              collapsed={false}
              onToggleCollapse={() => {}}
              isMobileDrawer={true}
              onCloseMobile={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header
          onToggleMobileMenu={() => setMobileDrawerOpen(true)}
          onOpenQuickSale={() => setCurrentSection('sales')}
          onOpenQuickExpense={() => setCurrentSection('expenses')}
          onNavigateToIA={() => setCurrentSection('director-ia')}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <OrgProvider>
      <MainLayout />
    </OrgProvider>
  );
}

export default App;
