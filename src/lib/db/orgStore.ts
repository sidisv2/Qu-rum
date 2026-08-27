import {
  Organization,
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
  AIRecommendation,
  AuditLog,
  NotificationItem,
  User
} from "../../types";
import { getInitialDemoState } from "../demo/initialData";

const STORAGE_PREFIX = "direx_store_v1_";

// Memory storage fallback for Node/testing environments where window.localStorage is absent
const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStore[key] || null;
      }
    }
    return memoryStore[key] || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        memoryStore[key] = value;
      }
    } else {
      memoryStore[key] = value;
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        delete memoryStore[key];
      }
    } else {
      delete memoryStore[key];
    }
  }
};

export interface AppState {
  currentUser: User | null;
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
  recommendations: AIRecommendation[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
}

export class OrganizationStore {
  private static defaultUser: User = {
    id: "usr-1",
    email: "valentin@direx.app",
    fullName: "Valentín Morales",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    createdAt: "2026-01-01T00:00:00.000Z"
  };

  public static getEmptyOrgState(orgId: string, orgName?: string): AppState {
    const emptyOrg: Organization = {
      id: orgId,
      name: orgName || "Mi Empresa",
      taxId: "",
      currency: "ARS",
      currencySymbol: "$",
      industry: "General",
      createdAt: new Date().toISOString(),
      isDemo: false
    };

    return {
      currentUser: this.defaultUser,
      currentOrg: emptyOrg,
      organizations: [emptyOrg],
      customers: [],
      suppliers: [],
      products: [],
      sales: [],
      expenses: [],
      receivables: [],
      payables: [],
      quotes: [],
      tasks: [],
      documents: [],
      recommendations: [],
      auditLogs: [],
      notifications: []
    };
  }

  public static loadState(): AppState {
    const orgId = safeStorage.getItem(STORAGE_PREFIX + "current_org_id");
    if (!orgId) {
      return {
        currentUser: null,
        currentOrg: null,
        organizations: [],
        customers: [],
        suppliers: [],
        products: [],
        sales: [],
        expenses: [],
        receivables: [],
        payables: [],
        quotes: [],
        tasks: [],
        documents: [],
        recommendations: [],
        auditLogs: [],
        notifications: []
      };
    }
    return this.loadOrgState(orgId);
  }

  public static loadOrgState(orgId: string): AppState {
    const raw = safeStorage.getItem(STORAGE_PREFIX + orgId);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          currentUser: parsed.currentUser || this.defaultUser
        };
      } catch (e) {
        console.error("Error reading storage", e);
      }
    }

    // Solo sembrar demo si el orgId es explícitamente el demo org
    if (orgId === "org-demo-100" || orgId.includes("demo")) {
      const demo = getInitialDemoState(orgId);
      const initialState: AppState = {
        currentUser: this.defaultUser,
        currentOrg: demo.organization,
        organizations: [demo.organization],
        customers: demo.customers,
        suppliers: demo.suppliers,
        products: demo.products,
        sales: demo.sales,
        expenses: demo.expenses,
        receivables: demo.receivables,
        payables: demo.payables,
        quotes: demo.quotes,
        tasks: demo.tasks,
        documents: demo.documents,
        recommendations: demo.recommendations,
        auditLogs: [],
        notifications: []
      };
      this.saveState(initialState);
      return initialState;
    }

    // Para cualquier otra organización nueva: 100% VACÍA
    const emptyState = this.getEmptyOrgState(orgId);
    this.saveState(emptyState);
    return emptyState;
  }

  public static saveState(state: AppState): void {
    if (!state.currentOrg) return;
    try {
      safeStorage.setItem(STORAGE_PREFIX + "current_org_id", state.currentOrg.id);
      safeStorage.setItem(STORAGE_PREFIX + state.currentOrg.id, JSON.stringify(state));
    } catch (e) {
      console.error("Error saving state to storage", e);
    }
  }

  public static resetToDemo(orgId: string = "org-demo-100"): AppState {
    safeStorage.removeItem(STORAGE_PREFIX + orgId);
    return this.loadOrgState(orgId);
  }

  public static clearStore(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {}
    }
    for (const k of Object.keys(memoryStore)) {
      delete memoryStore[k];
    }
  }
}
