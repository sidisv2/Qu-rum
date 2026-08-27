import { IDataRepository, PaginatedResult, PaginationParams, PaymentParams } from "./types";
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
  PaymentRecord,
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
    const orgId = "org-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    const newOrg: Organization = {
      ...org,
      id: orgId,
      createdAt: new Date().toISOString()
    };
    const cur = OrganizationStore.loadState();
    const newOrgState = OrganizationStore.getEmptyOrgState(orgId, newOrg.name);
    newOrgState.currentOrg = newOrg;
    newOrgState.organizations = [newOrg, ...(cur.organizations || [])];
    OrganizationStore.saveState(newOrgState);
    return newOrg;
  }

  async getCustomers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Customer>> {
    let items = this.getState(orgId).customers.filter(c => c.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(c => c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  }

  async getCustomerById(orgId: string, id: string): Promise<Customer | null> {
    const cust = this.getState(orgId).customers.find(c => c.id === id && c.organizationId === orgId);
    return cust || null;
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

  async getSuppliers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Supplier>> {
    let items = this.getState(orgId).suppliers.filter(s => s.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(s => s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  }

  async getSupplierById(orgId: string, id: string): Promise<Supplier | null> {
    const s = this.getState(orgId).suppliers.find(x => x.id === id && x.organizationId === orgId);
    return s || null;
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

  async getProducts(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Product>> {
    let items = this.getState(orgId).products.filter(p => p.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  }

  async getProductById(orgId: string, id: string): Promise<Product | null> {
    const p = this.getState(orgId).products.find(x => x.id === id && x.organizationId === orgId);
    return p || null;
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

  async getSales(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Sale>> {
    let items = this.getState(orgId).sales.filter(s => s.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(s => s.saleNumber.toLowerCase().includes(q) || (s.customerName && s.customerName.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  }

  async getSaleById(orgId: string, id: string): Promise<Sale | null> {
    const s = this.getState(orgId).sales.find(x => x.id === id && x.organizationId === orgId);
    return s || null;
  }

  async createSale(orgId: string, sale: Omit<Sale, "id" | "organizationId" | "createdAt">, _idempotencyKey?: string): Promise<Sale> {
    const st = this.getState(orgId);
    const calculatedSubtotal = (sale.items || []).reduce((acc, it) => acc + safeRound(it.quantity * it.unitPrice, 2), 0);
    const cleanTotal = safeRound(Math.max(0, calculatedSubtotal - (sale.discount || 0)), 2);

    const newSale: Sale = {
      ...sale,
      id: "sale-" + Date.now(),
      organizationId: orgId,
      subtotal: calculatedSubtotal,
      total: cleanTotal,
      createdAt: new Date().toISOString()
    };
    st.sales = [newSale, ...st.sales];

    // Generar cuenta por cobrar si está pendiente
    if (sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial") {
      st.receivables = [
        {
          id: "rec-" + Date.now(),
          organizationId: orgId,
          saleId: newSale.id,
          saleNumber: newSale.saleNumber,
          customerId: newSale.customerId,
          customerName: newSale.customerName,
          amount: cleanTotal,
          balance: cleanTotal,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          status: "pending",
          overdueDays: 0,
          createdAt: new Date().toISOString()
        },
        ...st.receivables
      ];
    }

    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "CREAR_VENTA",
      entityType: "sale",
      entityId: newSale.id,
      details: "Venta registrada por " + newSale.total,
      timestamp: new Date().toISOString()
    });

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

  async getExpenses(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Expense>> {
    let items = this.getState(orgId).expenses.filter(e => e.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(e => e.description.toLowerCase().includes(q) || (e.supplierName && e.supplierName.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  }

  async getExpenseById(orgId: string, id: string): Promise<Expense | null> {
    const e = this.getState(orgId).expenses.find(x => x.id === id && x.organizationId === orgId);
    return e || null;
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

  async updateExpense(orgId: string, id: string, data: Partial<Expense>): Promise<Expense> {
    const st = this.getState(orgId);
    let updated: Expense | null = null;
    st.expenses = st.expenses.map(e => {
      if (e.id === id && e.organizationId === orgId) {
        updated = { ...e, ...data, amount: data.amount !== undefined ? safeRound(data.amount, 2) : e.amount };
        return updated;
      }
      return e;
    });
    this.saveState(st);
    if (!updated) throw new Error("Expense not found");
    return updated;
  }

  async deleteExpense(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.expenses = st.expenses.filter(e => !(e.id === id && e.organizationId === orgId));
    this.saveState(st);
    return true;
  }

  async getQuotes(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Quote>> {
    let items = this.getState(orgId).quotes.filter(q => q.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(qItem => qItem.quoteNumber.toLowerCase().includes(q) || (qItem.customerName && qItem.customerName.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  }

  async getQuoteById(orgId: string, id: string): Promise<Quote | null> {
    const q = this.getState(orgId).quotes.find(x => x.id === id && x.organizationId === orgId);
    return q || null;
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

  async getReceivables(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Receivable>> {
    let items = this.getState(orgId).receivables.filter(r => r.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(r => r.customerName.toLowerCase().includes(q) || (r.saleNumber && r.saleNumber.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    return { data: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
  }

  async getReceivableById(orgId: string, id: string): Promise<Receivable | null> {
    return this.getState(orgId).receivables.find(r => r.id === id && r.organizationId === orgId) || null;
  }

  async getReceivablePayments(orgId: string, receivableId: string): Promise<PaymentRecord[]> {
    const r = await this.getReceivableById(orgId, receivableId);
    return r?.payments || [];
  }

  async recordPaymentReceivable(orgId: string, receivableId: string, payment: PaymentParams): Promise<Receivable> {
    const st = this.getState(orgId);
    const rec = st.receivables.find(r => r.id === receivableId && r.organizationId === orgId);
    if (!rec) throw new Error("Receivable not found");
    if (rec.status === 'paid' || rec.balance <= 0) throw new Error("La cuenta ya se encuentra saldada");

    const cleanAmount = safeRound(payment.amount, 2);
    if (cleanAmount <= 0) throw new Error("El monto del pago debe ser mayor a cero");
    if (cleanAmount > rec.balance) throw new Error("El monto del pago supera el saldo pendiente");

    const newBalance = safeRound(rec.balance - cleanAmount, 2);
    rec.balance = newBalance;
    rec.status = newBalance === 0 ? 'paid' : 'partial';

    const paymentRecord: PaymentRecord = {
      id: "pay-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      organizationId: orgId,
      documentId: receivableId,
      amount: cleanAmount,
      paymentDate: payment.paymentDate || new Date().toISOString().split("T")[0],
      paymentMethod: payment.paymentMethod || "Transferencia",
      reference: payment.reference,
      notes: payment.notes,
      createdAt: new Date().toISOString()
    };
    if (!rec.payments) rec.payments = [];
    rec.payments.unshift(paymentRecord);

    const cust = st.customers.find(c => c.id === rec.customerId);
    if (cust) {
      cust.totalPendingDebt = Math.max(0, safeRound(cust.totalPendingDebt - cleanAmount, 2));
    }

    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "REGISTRAR_COBRO",
      entityType: "receivable_payment",
      entityId: paymentRecord.id,
      details: "Cobro de " + cleanAmount + " aplicado a " + (rec.saleNumber || rec.id) + ". Saldo restante: " + newBalance,
      timestamp: new Date().toISOString()
    });

    this.saveState(st);
    return rec;
  }

  async getPayables(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Payable>> {
    let items = this.getState(orgId).payables.filter(p => p.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(p => p.supplierName.toLowerCase().includes(q));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    return { data: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
  }

  async getPayableById(orgId: string, id: string): Promise<Payable | null> {
    return this.getState(orgId).payables.find(p => p.id === id && p.organizationId === orgId) || null;
  }

  async getPayablePayments(orgId: string, payableId: string): Promise<PaymentRecord[]> {
    const p = await this.getPayableById(orgId, payableId);
    return p?.payments || [];
  }

  async recordPaymentPayable(orgId: string, payableId: string, payment: PaymentParams): Promise<Payable> {
    const st = this.getState(orgId);
    const pay = st.payables.find(p => p.id === payableId && p.organizationId === orgId);
    if (!pay) throw new Error("Payable not found");
    if (pay.status === 'paid' || pay.balance <= 0) throw new Error("La cuenta ya se encuentra saldada");

    const cleanAmount = safeRound(payment.amount, 2);
    if (cleanAmount <= 0) throw new Error("El monto del pago debe ser mayor a cero");
    if (cleanAmount > pay.balance) throw new Error("El monto del pago supera el saldo pendiente");

    const newBalance = safeRound(pay.balance - cleanAmount, 2);
    pay.balance = newBalance;
    pay.status = newBalance === 0 ? 'paid' : 'partial';

    const paymentRecord: PaymentRecord = {
      id: "pay-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      organizationId: orgId,
      documentId: payableId,
      amount: cleanAmount,
      paymentDate: payment.paymentDate || new Date().toISOString().split("T")[0],
      paymentMethod: payment.paymentMethod || "Transferencia",
      reference: payment.reference,
      notes: payment.notes,
      createdAt: new Date().toISOString()
    };
    if (!pay.payments) pay.payments = [];
    pay.payments.unshift(paymentRecord);

    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "REGISTRAR_PAGO_PROVEEDOR",
      entityType: "payable_payment",
      entityId: paymentRecord.id,
      details: "Pago de " + cleanAmount + " a " + pay.supplierName + ". Saldo restante: " + newBalance,
      timestamp: new Date().toISOString()
    });

    this.saveState(st);
    return pay;
  }

  // --- TASKS ---
  async getTasks(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Task>> {
    let items = this.getState(orgId).tasks.filter(t => t.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }
    if (params?.status) {
      items = items.filter(t => t.status === params.status);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    return {
      data: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize
    };
  }

  async getTaskById(orgId: string, id: string): Promise<Task | null> {
    return this.getState(orgId).tasks.find(t => t.id === id && t.organizationId === orgId) || null;
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
    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "CREAR_TAREA",
      entityType: "task",
      entityId: newTask.id,
      details: "Tarea creada: " + newTask.title,
      timestamp: new Date().toISOString()
    });
    this.saveState(st);
    return newTask;
  }

  async updateTask(orgId: string, id: string, data: Partial<Task>): Promise<Task> {
    const st = this.getState(orgId);
    let updated: Task | null = null;
    st.tasks = st.tasks.map(t => {
      if (t.id === id && t.organizationId === orgId) {
        updated = { ...t, ...data };
        return updated;
      }
      return t;
    });
    if (!updated) throw new Error("Task not found");
    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "ACTUALIZAR_TAREA",
      entityType: "task",
      entityId: id,
      details: "Tarea actualizada",
      timestamp: new Date().toISOString()
    });
    this.saveState(st);
    return updated;
  }

  async toggleTaskStatus(orgId: string, id: string): Promise<Task> {
    const st = this.getState(orgId);
    let updated: Task | null = null;
    st.tasks = st.tasks.map(t => {
      if (t.id === id && t.organizationId === orgId) {
        const nextStatus: Task["status"] = t.status === "completed" ? "pending" : "completed";
        updated = { ...t, status: nextStatus };
        return updated;
      }
      return t;
    });
    if (!updated) throw new Error("Task not found");
    this.saveState(st);
    return updated;
  }

  async deleteTask(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.tasks = st.tasks.filter(t => !(t.id === id && t.organizationId === orgId));
    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "ELIMINAR_TAREA",
      entityType: "task",
      entityId: id,
      details: "Tarea eliminada",
      timestamp: new Date().toISOString()
    });
    this.saveState(st);
    return true;
  }

  async getDocuments(orgId: string, params?: PaginationParams): Promise<PaginatedResult<DocumentRecord>> {
    let items = this.getState(orgId).documents.filter(d => d.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(d => d.name.toLowerCase().includes(q));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    return {
      data: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize
    };
  }

  async getDocumentById(orgId: string, id: string): Promise<DocumentRecord | null> {
    return this.getState(orgId).documents.find(d => d.id === id && d.organizationId === orgId) || null;
  }

  async createDocumentMetadata(orgId: string, doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">): Promise<DocumentRecord> {
    const st = this.getState(orgId);
    const newDoc: DocumentRecord = {
      ...doc,
      id: "doc-" + Date.now(),
      organizationId: orgId,
      name: sanitizeCsvField(doc.name),
      createdAt: new Date().toISOString()
    };
    st.documents = [newDoc, ...st.documents];
    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "CREAR_DOCUMENTO",
      entityType: "document",
      entityId: newDoc.id,
      details: "Documento registrado: " + newDoc.name,
      timestamp: new Date().toISOString()
    });
    this.saveState(st);
    return newDoc;
  }

  async deleteDocument(orgId: string, id: string): Promise<boolean> {
    const st = this.getState(orgId);
    st.documents = st.documents.filter(d => !(d.id === id && d.organizationId === orgId));
    st.auditLogs.unshift({
      id: "log-" + Date.now(),
      organizationId: orgId,
      userId: "usr-local",
      userName: "Usuario Local",
      action: "ELIMINAR_DOCUMENTO",
      entityType: "document",
      entityId: id,
      details: "Documento eliminado",
      timestamp: new Date().toISOString()
    });
    this.saveState(st);
    return true;
  }

  async getAuditLogs(orgId: string, params?: PaginationParams): Promise<PaginatedResult<AuditLog>> {
    let items = this.getState(orgId).auditLogs.filter(a => a.organizationId === orgId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(a => a.action.toLowerCase().includes(q) || a.details.toLowerCase().includes(q));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    return {
      data: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize
    };
  }

  async addAuditLog(orgId: string, log: Omit<AuditLog, "id" | "organizationId" | "timestamp">): Promise<AuditLog> {
    const st = this.getState(orgId);
    const newLog: AuditLog = {
      ...log,
      id: "log-" + Date.now(),
      organizationId: orgId,
      timestamp: new Date().toISOString()
    };
    st.auditLogs.unshift(newLog);
    this.saveState(st);
    return newLog;
  }

    async getNotifications(orgId: string): Promise<NotificationItem[]> {
    return this.getState(orgId).notifications.filter(n => n.organizationId === orgId);
  }
}
