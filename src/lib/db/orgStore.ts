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

const STORAGE_PREFIX = "quorum_store_v1_";

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
    email: "valentin@quorum.app",
    fullName: "Valentín Morales",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    createdAt: "2026-01-01T00:00:00.000Z"
  };

  public static loadState(): AppState {
    const orgId = localStorage.getItem(STORAGE_PREFIX + "current_org_id") || "org-demo-100";
    const raw = localStorage.getItem(STORAGE_PREFIX + orgId);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          currentUser: parsed.currentUser || this.defaultUser
        };
      } catch (e) {
        console.error("Error reading localStorage, reverting to demo state", e);
      }
    }

    const demo = getInitialDemoState(orgId);
    const notifications: NotificationItem[] = [
      {
        id: "notif-1",
        organizationId: orgId,
        type: "danger",
        title: "Deuda vencida",
        message: "Carlos Benítez tiene una deuda de $180.000 vencida hace 23 días.",
        isRead: false,
        createdAt: "2026-08-26T08:00:00.000Z"
      },
      {
        id: "notif-2",
        organizationId: orgId,
        type: "warning",
        title: "Presupuestos por vencer",
        message: "4 presupuestos vencen esta semana por $6.028.500.",
        isRead: false,
        createdAt: "2026-08-26T08:00:00.000Z"
      }
    ];

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
      auditLogs: demo.auditLogs,
      notifications
    };

    this.saveState(initialState);
    return initialState;
  }

  public static saveState(state: AppState): void {
    if (!state.currentOrg) return;
    localStorage.setItem(STORAGE_PREFIX + "current_org_id", state.currentOrg.id);
    localStorage.setItem(STORAGE_PREFIX + state.currentOrg.id, JSON.stringify(state));
  }

  public static resetToDemo(orgId: string = "org-demo-100"): AppState {
    localStorage.removeItem(STORAGE_PREFIX + orgId);
    return this.loadState();
  }
}
