import { IDataRepository } from "./types";
import { OrganizationStore, AppState } from "../db/orgStore";
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
  AuditLog,
  NotificationItem
} from "../../types";
import { safeRound, sanitizeCsvField } from "../utils/formatters";

export class LocalRepository implements IDataRepository {
  private getState(orgId: string): AppState {
    return OrganizationStore.loadOrgState(orgId);
  }

  private saveState(state: AppState): void {
    OrganizationStore.saveState(state);
  }

  async getOrganizations(): Promise<Organization[]> {
    const st = OrganizationStore.loadState();
    return st.organizations || [];
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const st = this.getState(id);
    return st.currentOrg;
  }

  async createOrganization(org: Omit<Organization, "id" | "createdAt">): Promise<Organization> {
    const newOrg: Organization = {
      ...org,
      id: "org-" + Date.now(),
      createdAt: new Date().toISOString()
    };
    const cur = OrganizationStore.loadState();
    const next: AppState = {
      ...cur,
      currentOrg: newOrg,
      organizations: [newOrg, ...cur.organizations]
    };
    this.saveState(next);
    return newOrg;
  }

  async getCustomers(orgId: string): Promise<Customer[]> {
    return this.getState(orgId).customers.filter(c => c.organizationId === orgId);
  }

  async createCustomer(orgId: string, customer: Omit<Customer, "id" | "organizationId" | "createdAt">): Promise<Customer> {
    const st = this.getState(orgId);
    const newCust: Customer = {
      ...customer,
      id: "cust-" + Date.now(),
      organizationId: orgId,
      name: sanitizeCsvField(customer.name),
      totalSpent: safeRound(customer.totalSpent, 2),
      totalPendingDebt: safeRound(customer.totalPendingDebt, 2),
      createdAt: new Date().toISOString()
    };
    st.customers = [newCust, ...st.customers];
    this.saveState(st);
    return newCust;
  }

  async updateCustomer(orgId: string, id: string, data: Partial<Customer>): Promise<Customer> {
    const st = this.getState(orgId);
    let updated: Customer | null = null;
    st.customers = st.customers.map(c => {
      if (c.id === id && c.organizationId === orgId) {
        updated = { ...c, ...data };
        return updated;
      }
      return c;
    });
    this.saveState(st);
    if (!updated) throw new Error("Customer not found");
    return updated;
  }

  async deleteCustomer(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    const initialLen = st.customers.length;
    st.customers = st.customers.filter(c => !(c.id === id && c.organizationId === orgId));
    this.saveState(st);
    return st.customers.length < initialLen;
  }

  async getSuppliers(orgId: string): Promise<Supplier[]> {
    return this.getState(orgId).suppliers.filter(s => s.organizationId === orgId);
  }

  async createSupplier(orgId: string, supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">): Promise<Supplier> {
    const st = this.getState(orgId);
    const newSup: Supplier = {
      ...supplier,
      id: "sup-" + Date.now(),
      organizationId: orgId,
      name: sanitizeCsvField(supplier.name),
      createdAt: new Date().toISOString()
    };
    st.suppliers = [newSup, ...st.suppliers];
    this.saveState(st);
    return newSup;
  }

  async updateSupplier(orgId: string, id: string, data: Partial<Supplier>): Promise<Supplier> {
    const st = this.getState(orgId);
    let updated: Supplier | null = null;
    st.suppliers = st.suppliers.map(s => {
      if (s.id === id && s.organizationId === orgId) {
        updated = { ...s, ...data };
        return updated;
      }
      return s;
    });
    this.saveState(st);
    if (!updated) throw new Error("Supplier not found");
    return updated;
  }

  async deleteSupplier(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.suppliers = st.suppliers.filter(s => !(s.id === id && s.organizationId === orgId));
    this.saveState(st);
    return true;
  }

  async getProducts(orgId: string): Promise<Product[]> {
    return this.getState(orgId).products.filter(p => p.organizationId === orgId);
  }

  async createProduct(orgId: string, product: Omit<Product, "id" | "organizationId" | "createdAt">): Promise<Product> {
    const st = this.getState(orgId);
    const newProd: Product = {
      ...product,
      id: "prod-" + Date.now(),
      organizationId: orgId,
      name: sanitizeCsvField(product.name),
      cost: safeRound(product.cost, 2),
      price: safeRound(product.price, 2),
      marginAmount: safeRound(product.marginAmount, 2),
      marginPercent: safeRound(product.marginPercent, 1),
      createdAt: new Date().toISOString()
    };
    st.products = [newProd, ...st.products];
    this.saveState(st);
    return newProd;
  }

  async updateProduct(orgId: string, id: string, data: Partial<Product>): Promise<Product> {
    const st = this.getState(orgId);
    let updated: Product | null = null;
    st.products = st.products.map(p => {
      if (p.id === id && p.organizationId === orgId) {
        updated = { ...p, ...data };
        return updated;
      }
      return p;
    });
    this.saveState(st);
    if (!updated) throw new Error("Product not found");
    return updated;
  }

  async deleteProduct(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.products = st.products.filter(p => !(p.id === id && p.organizationId === orgId));
    this.saveState(st);
    return true;
  }

  async getSales(orgId: string): Promise<Sale[]> {
    return this.getState(orgId).sales.filter(s => s.organizationId === orgId);
  }

  async createSale(orgId: string, sale: Omit<Sale, "id" | "organizationId" | "createdAt">): Promise<Sale> {
    const st = this.getState(orgId);
    const cleanTotal = safeRound(sale.total, 2);
    const newSale: Sale = {
      ...sale,
      id: "sale-" + Date.now(),
      organizationId: orgId,
      total: cleanTotal,
      subtotal: safeRound(sale.subtotal, 2),
      createdAt: new Date().toISOString()
    };
    st.sales = [newSale, ...st.sales];
    this.saveState(st);
    return newSale;
  }

  async updateSaleStatus(orgId: string, id: string, status: Sale["status"]): Promise<Sale> {
    const st = this.getState(orgId);
    let updated: Sale | null = null;
    st.sales = st.sales.map(s => {
      if (s.id === id && s.organizationId === orgId) {
        updated = { ...s, status };
        return updated;
      }
      return s;
    });
    this.saveState(st);
    if (!updated) throw new Error("Sale not found");
    return updated;
  }

  async getExpenses(orgId: string): Promise<Expense[]> {
    return this.getState(orgId).expenses.filter(e => e.organizationId === orgId);
  }

  async createExpense(orgId: string, expense: Omit<Expense, "id" | "organizationId" | "createdAt">): Promise<Expense> {
    const st = this.getState(orgId);
    const newExp: Expense = {
      ...expense,
      id: "exp-" + Date.now(),
      organizationId: orgId,
      amount: safeRound(expense.amount, 2),
      createdAt: new Date().toISOString()
    };
    st.expenses = [newExp, ...st.expenses];
    this.saveState(st);
    return newExp;
  }

  async deleteExpense(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.expenses = st.expenses.filter(e => !(e.id === id && e.organizationId === orgId));
    this.saveState(st);
    return true;
  }

  async getReceivables(orgId: string): Promise<Receivable[]> {
    return this.getState(orgId).receivables.filter(r => r.organizationId === orgId);
  }

  async recordPaymentReceivable(orgId: string, receivableId: string, amount: number): Promise<Receivable> {
    const st = this.getState(orgId);
    const cleanAmount = safeRound(amount, 2);
    let updatedRec: Receivable | null = null;
    st.receivables = st.receivables.map(r => {
      if (r.id === receivableId && r.organizationId === orgId) {
        const newBalance = Math.max(0, safeRound(r.balance - cleanAmount, 2));
        updatedRec = {
          ...r,
          balance: newBalance,
          status: newBalance === 0 ? "paid" : "partial"
        };
        return updatedRec;
      }
      return r;
    });
    this.saveState(st);
    if (!updatedRec) throw new Error("Receivable not found");
    return updatedRec;
  }

  async getPayables(orgId: string): Promise<Payable[]> {
    return this.getState(orgId).payables.filter(p => p.organizationId === orgId);
  }

  async recordPaymentPayable(orgId: string, payableId: string, amount: number): Promise<Payable> {
    const st = this.getState(orgId);
    const cleanAmount = safeRound(amount, 2);
    let updatedPay: Payable | null = null;
    st.payables = st.payables.map(p => {
      if (p.id === payableId && p.organizationId === orgId) {
        const newBalance = Math.max(0, safeRound(p.balance - cleanAmount, 2));
        updatedPay = {
          ...p,
          balance: newBalance,
          status: newBalance === 0 ? "paid" : "partial"
        };
        return updatedPay;
      }
      return p;
    });
    this.saveState(st);
    if (!updatedPay) throw new Error("Payable not found");
    return updatedPay;
  }

  async getQuotes(orgId: string): Promise<Quote[]> {
    return this.getState(orgId).quotes.filter(q => q.organizationId === orgId);
  }

  async createQuote(orgId: string, quote: Omit<Quote, "id" | "organizationId" | "createdAt">): Promise<Quote> {
    const st = this.getState(orgId);
    const newQuote: Quote = {
      ...quote,
      id: "quo-" + Date.now(),
      organizationId: orgId,
      total: safeRound(quote.total, 2),
      createdAt: new Date().toISOString()
    };
    st.quotes = [newQuote, ...st.quotes];
    this.saveState(st);
    return newQuote;
  }

  async updateQuoteStatus(orgId: string, id: string, status: Quote["status"]): Promise<Quote> {
    const st = this.getState(orgId);
    let updated: Quote | null = null;
    st.quotes = st.quotes.map(q => {
      if (q.id === id && q.organizationId === orgId) {
        updated = { ...q, status };
        return updated;
      }
      return q;
    });
    this.saveState(st);
    if (!updated) throw new Error("Quote not found");
    return updated;
  }

  async getTasks(orgId: string): Promise<Task[]> {
    return this.getState(orgId).tasks.filter(t => t.organizationId === orgId);
  }

  async createTask(orgId: string, task: Omit<Task, "id" | "organizationId" | "createdAt">): Promise<Task> {
    const st = this.getState(orgId);
    const newTask: Task = {
      ...task,
      id: "tsk-" + Date.now(),
      organizationId: orgId,
      title: sanitizeCsvField(task.title),
      createdAt: new Date().toISOString()
    };
    st.tasks = [newTask, ...st.tasks];
    this.saveState(st);
    return newTask;
  }

  async toggleTaskStatus(orgId: string, id: string): Promise<Task> {
    const st = this.getState(orgId);
    let updated: Task | null = null;
    st.tasks = st.tasks.map(t => {
      if (t.id === id && t.organizationId === orgId) {
        updated = { ...t, status: t.status === "completed" ? "pending" : "completed" };
        return updated;
      }
      return t;
    });
    this.saveState(st);
    if (!updated) throw new Error("Task not found");
    return updated;
  }

  async deleteTask(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.tasks = st.tasks.filter(t => !(t.id === id && t.organizationId === orgId));
    this.saveState(st);
    return true;
  }

  async getDocuments(orgId: string): Promise<DocumentRecord[]> {
    return this.getState(orgId).documents.filter(d => d.organizationId === orgId);
  }

  async uploadDocument(orgId: string, doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">): Promise<DocumentRecord> {
    const st = this.getState(orgId);
    const newDoc: DocumentRecord = {
      ...doc,
      id: "doc-" + Date.now(),
      organizationId: orgId,
      name: sanitizeCsvField(doc.name),
      createdAt: new Date().toISOString()
    };
    st.documents = [newDoc, ...st.documents];
    this.saveState(st);
    return newDoc;
  }

  async deleteDocument(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.documents = st.documents.filter(d => !(d.id === id && d.organizationId === orgId));
    this.saveState(st);
    return true;
  }

  async getAuditLogs(orgId: string): Promise<AuditLog[]> {
    return this.getState(orgId).auditLogs.filter(a => a.organizationId === orgId);
  }

  async addAuditLog(orgId: string, log: Omit<AuditLog, "id" | "organizationId" | "timestamp">): Promise<AuditLog> {
    const st = this.getState(orgId);
    const newLog: AuditLog = {
      ...log,
      id: "aud-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      organizationId: orgId,
      timestamp: new Date().toISOString()
    };
    st.auditLogs = [newLog, ...st.auditLogs];
    this.saveState(st);
    return newLog;
  }

  async getNotifications(orgId: string): Promise<NotificationItem[]> {
    return this.getState(orgId).notifications.filter(n => n.organizationId === orgId);
  }
}
