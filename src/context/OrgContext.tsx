import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Organization,
  User,
  Customer,
  Supplier,
  Product,
  Sale,
  Expense,
  Receivable,
  Payable,
  Quote,
  Task,
  DocumentRecord,
  AuditLog,
  NotificationItem,
  Role
} from "../types";
import { getRepository } from "../lib/repository/index";
import { useAuth } from "./AuthContext";
import { OrganizationOnboardingView } from "../components/auth/OrganizationOnboardingView";
import { safeRound, sanitizeCsvField } from "../lib/utils/formatters";

interface OrgContextType {
  currentUser: User | null;
  currentRole: Role;
  currentOrg: Organization | null;
  organizations: Organization[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  receivables: Receivable[];
  payables: Payable[];
  quotes: Quote[];
  tasks: Task[];
  documents: DocumentRecord[];
  recommendations: any[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  userRole: Role;
  isLoadingData: boolean;

  setCurrentOrg: (org: Organization) => void;
  switchOrganization: (orgId: string) => Promise<void>;
  createNewOrganization: (name: string, industry?: string, taxId?: string) => Promise<void>;
  hasPermission: (allowedRoles: Role[]) => boolean;

  createCustomer: (customer: Omit<Customer, "id" | "organizationId" | "createdAt">) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  createSupplier: (supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  createProduct: (product: Omit<Product, "id" | "organizationId" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  createSale: (sale: Omit<Sale, "id" | "organizationId" | "createdAt">) => Promise<void>;
  updateSaleStatus: (id: string, status: Sale["status"]) => Promise<void>;

  createExpense: (expense: Omit<Expense, "id" | "organizationId" | "createdAt">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  recordPaymentReceivable: (receivableId: string, amount: number) => Promise<void>;
  recordPaymentPayable: (payableId: string, amount: number) => Promise<void>;

  createQuote: (quote: Omit<Quote, "id" | "organizationId" | "createdAt">) => Promise<void>;
  updateQuoteStatus: (id: string, status: Quote["status"]) => Promise<void>;

  createTask: (task: Omit<Task, "id" | "organizationId" | "createdAt">) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  uploadDocument: (doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  applyAIRecommendation: (id: string) => void;
  dismissAIRecommendation: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  importBulkData: (entity: string, records: any[]) => number;
  resetDemoData: () => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const repo = getRepository();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userRole] = useState<Role>("owner");
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // 1. Cargar Organizaciones Iniciales
  useEffect(() => {
    let isMounted = true;

    async function loadInitialOrgs() {
      setIsLoadingData(true);
      try {
        const orgs = await repo.getOrganizations();
        if (isMounted) {
          setOrganizations(orgs);
          if (orgs.length > 0) {
            setCurrentOrg(orgs[0]);
          } else {
            setCurrentOrg(null);
          }
        }
      } catch (err) {
        console.error("Error loading organizations:", err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    loadInitialOrgs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Cargar Entidades de la Organización Activa
  useEffect(() => {
    if (!currentOrg) return;

    let isMounted = true;
    const orgId = currentOrg.id;

    async function loadOrgData() {
      try {
        const [cRes, sRes, pRes, sl, ex, rec, pay, q, t, d, a, n] = await Promise.all([
          repo.getCustomers(orgId),
          repo.getSuppliers(orgId),
          repo.getProducts(orgId),
          repo.getSales(orgId),
          repo.getExpenses(orgId),
          repo.getReceivables(orgId),
          repo.getPayables(orgId),
          repo.getQuotes(orgId),
          repo.getTasks(orgId),
          repo.getDocuments(orgId),
          repo.getAuditLogs(orgId),
          repo.getNotifications(orgId)
        ]);

        if (isMounted) {
          setCustomers(cRes.data);
          setSuppliers(sRes.data);
          setProducts(pRes.data);
          setSales(sl.data);
          setExpenses(ex.data);
          setReceivables(rec);
          setPayables(pay);
          setQuotes(q.data);
          setTasks(t);
          setDocuments(d);
          setAuditLogs(a);
          setNotifications(n);
        }
      } catch (err) {
        console.error("Error loading org data:", err);
      }
    }

    loadOrgData();

    return () => {
      isMounted = false;
    };
  }, [currentOrg]);

  const switchOrganization = async (orgId: string): Promise<void> => {
    const target = organizations.find(o => o.id === orgId);
    if (target) {
      setCurrentOrg(target);
    }
  };

  const createNewOrganization = async (name: string, industry: string = "General", taxId: string = ""): Promise<void> => {
    const created = await repo.createOrganization({
      name: sanitizeCsvField(name),
      taxId: sanitizeCsvField(taxId),
      industry: sanitizeCsvField(industry),
      currency: "ARS",
      currencySymbol: "$",
      isDemo: false
    });
    setOrganizations(prev => [created, ...prev]);
    setCurrentOrg(created);
  };

  const hasPermission = (allowedRoles: Role[]): boolean => {
    return allowedRoles.includes(userRole);
  };

  const createCustomer = async (cust: Omit<Customer, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createCustomer(currentOrg.id, cust);
    setCustomers(prev => [created, ...prev]);
    await repo.addAuditLog(currentOrg.id, {
      userId: user?.id || "usr-1",
      userName: user?.fullName || "Usuario",
      action: "CREAR_CLIENTE",
      entityType: "customer",
      entityId: created.id,
      details: "Cliente creado: " + created.name
    });
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.updateCustomer(currentOrg.id, id, data);
    setCustomers(prev => prev.map(c => c.id === id ? updated : c));
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    await repo.deleteCustomer(currentOrg.id, id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const createSupplier = async (sup: Omit<Supplier, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createSupplier(currentOrg.id, sup);
    setSuppliers(prev => [created, ...prev]);
  };

  const updateSupplier = async (id: string, data: Partial<Supplier>): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.updateSupplier(currentOrg.id, id, data);
    setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteSupplier = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    await repo.deleteSupplier(currentOrg.id, id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const createProduct = async (prod: Omit<Product, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createProduct(currentOrg.id, prod);
    setProducts(prev => [created, ...prev]);
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.updateProduct(currentOrg.id, id, data);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deleteProduct = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    await repo.deleteProduct(currentOrg.id, id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const createSale = async (s: Omit<Sale, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createSale(currentOrg.id, s);
    setSales(prev => [created, ...prev]);
  };

  const updateSaleStatus = async (id: string, status: Sale["status"]): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.updateSaleStatus(currentOrg.id, id, status);
    setSales(prev => prev.map(s => s.id === id ? updated : s));
  };

  const createExpense = async (e: Omit<Expense, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createExpense(currentOrg.id, e);
    setExpenses(prev => [created, ...prev]);
  };

  const deleteExpense = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    await repo.deleteExpense(currentOrg.id, id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const recordPaymentReceivable = async (id: string, amount: number): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.recordPaymentReceivable(currentOrg.id, id, amount);
    setReceivables(prev => prev.map(r => r.id === id ? updated : r));
  };

  const recordPaymentPayable = async (id: string, amount: number): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.recordPaymentPayable(currentOrg.id, id, amount);
    setPayables(prev => prev.map(p => p.id === id ? updated : p));
  };

  const createQuote = async (q: Omit<Quote, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createQuote(currentOrg.id, q);
    setQuotes(prev => [created, ...prev]);
  };

  const updateQuoteStatus = async (id: string, status: Quote["status"]): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.updateQuoteStatus(currentOrg.id, id, status);
    setQuotes(prev => prev.map(q => q.id === id ? updated : q));
  };

  const createTask = async (t: Omit<Task, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.createTask(currentOrg.id, t);
    setTasks(prev => [created, ...prev]);
  };

  const toggleTaskStatus = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    const updated = await repo.toggleTaskStatus(currentOrg.id, id);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const deleteTask = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    await repo.deleteTask(currentOrg.id, id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const uploadDocument = async (d: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">): Promise<void> => {
    if (!currentOrg) return;
    const created = await repo.uploadDocument(currentOrg.id, d);
    setDocuments(prev => [created, ...prev]);
  };

  const deleteDocument = async (id: string): Promise<void> => {
    if (!currentOrg) return;
    await repo.deleteDocument(currentOrg.id, id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const applyAIRecommendation = (id: string) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: "applied" } : r));
  };

  const dismissAIRecommendation = (id: string) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: "dismissed" } : r));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const importBulkData = (entity: string, records: any[]): number => {
    return records.length;
  };

  const resetDemoData = () => {
    if (currentOrg) {
      switchOrganization(currentOrg.id);
    }
  };

  // Si no hay organizaciones disponibles, mostrar onboarding
  if (!isLoadingData && (!currentOrg || organizations.length === 0)) {
    return (
      <OrgContext.Provider
        value={{
          currentUser: user,
          currentRole: userRole,
          currentOrg,
          organizations,
          customers,
          suppliers,
          products,
          sales,
          expenses,
          receivables,
          payables,
          quotes,
          tasks,
          documents,
          recommendations,
          auditLogs,
          notifications,
          userRole,
          isLoadingData,
          setCurrentOrg: (org) => setCurrentOrg(org),
          switchOrganization,
          createNewOrganization,
          hasPermission,
          createCustomer,
          updateCustomer,
          deleteCustomer,
          createSupplier,
          updateSupplier,
          deleteSupplier,
          createProduct,
          updateProduct,
          deleteProduct,
          createSale,
          updateSaleStatus,
          createExpense,
          deleteExpense,
          recordPaymentReceivable,
          recordPaymentPayable,
          createQuote,
          updateQuoteStatus,
          createTask,
          toggleTaskStatus,
          deleteTask,
          uploadDocument,
          deleteDocument,
          applyAIRecommendation,
          dismissAIRecommendation,
          markNotificationAsRead,
          markAllNotificationsAsRead,
          importBulkData,
          resetDemoData
        }}
      >
        <OrganizationOnboardingView />
      </OrgContext.Provider>
    );
  }

  return (
    <OrgContext.Provider
      value={{
        currentUser: user,
        currentRole: userRole,
        currentOrg,
        organizations,
        customers,
        suppliers,
        products,
        sales,
        expenses,
        receivables,
        payables,
        quotes,
        tasks,
        documents,
        recommendations,
        auditLogs,
        notifications,
        userRole,
        isLoadingData,
        setCurrentOrg: (org) => setCurrentOrg(org),
        switchOrganization,
        createNewOrganization,
        hasPermission,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        createProduct,
        updateProduct,
        deleteProduct,
        createSale,
        updateSaleStatus,
        createExpense,
        deleteExpense,
        recordPaymentReceivable,
        recordPaymentPayable,
        createQuote,
        updateQuoteStatus,
        createTask,
        toggleTaskStatus,
        deleteTask,
        uploadDocument,
        deleteDocument,
        applyAIRecommendation,
        dismissAIRecommendation,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        importBulkData,
        resetDemoData
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = (): OrgContextType => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
};
