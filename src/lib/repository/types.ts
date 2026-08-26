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

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface IDataRepository {
  // Organizations
  getOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: string): Promise<Organization | null>;
  createOrganization(org: Omit<Organization, "id" | "createdAt">): Promise<Organization>;

  // Customers (Módulo Maestro)
  getCustomers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Customer>>;
  getCustomerById(orgId: string, id: string): Promise<Customer | null>;
  createCustomer(orgId: string, customer: Omit<Customer, "id" | "organizationId" | "createdAt">): Promise<Customer>;
  updateCustomer(orgId: string, id: string, data: Partial<Customer>): Promise<Customer>;
  deleteCustomer(orgId: string, id: string): Promise<boolean>;

  // Suppliers (Módulo Maestro)
  getSuppliers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Supplier>>;
  getSupplierById(orgId: string, id: string): Promise<Supplier | null>;
  createSupplier(orgId: string, supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">): Promise<Supplier>;
  updateSupplier(orgId: string, id: string, data: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(orgId: string, id: string): Promise<boolean>;

  // Products (Módulo Maestro)
  getProducts(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Product>>;
  getProductById(orgId: string, id: string): Promise<Product | null>;
  createProduct(orgId: string, product: Omit<Product, "id" | "organizationId" | "createdAt">): Promise<Product>;
  updateProduct(orgId: string, id: string, data: Partial<Product>): Promise<Product>;
  deleteProduct(orgId: string, id: string): Promise<boolean>;

  // Sales & Sale Items (Módulo Financiero - Fase 4D.3)
  getSales(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Sale>>;
  getSaleById(orgId: string, id: string): Promise<Sale | null>;
  createSale(orgId: string, sale: Omit<Sale, "id" | "organizationId" | "createdAt">, idempotencyKey?: string): Promise<Sale>;
  updateSaleStatus(orgId: string, id: string, status: Sale["status"]): Promise<Sale>;

  // Expenses (Módulo Financiero - Fase 4D.3)
  getExpenses(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Expense>>;
  getExpenseById(orgId: string, id: string): Promise<Expense | null>;
  createExpense(orgId: string, expense: Omit<Expense, "id" | "organizationId" | "createdAt">): Promise<Expense>;
  updateExpense(orgId: string, id: string, data: Partial<Expense>): Promise<Expense>;
  deleteExpense(orgId: string, id: string): Promise<boolean>;

  // Quotes & Items (Módulo Financiero - Fase 4D.3)
  getQuotes(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Quote>>;
  getQuoteById(orgId: string, id: string): Promise<Quote | null>;
  createQuote(orgId: string, quote: Omit<Quote, "id" | "organizationId" | "createdAt">): Promise<Quote>;
  updateQuoteStatus(orgId: string, id: string, status: Quote["status"]): Promise<Quote>;

  // Receivables & Payables
  getReceivables(orgId: string): Promise<Receivable[]>;
  recordPaymentReceivable(orgId: string, receivableId: string, amount: number): Promise<Receivable>;
  getPayables(orgId: string): Promise<Payable[]>;
  recordPaymentPayable(orgId: string, payableId: string, amount: number): Promise<Payable>;

  // Tasks
  getTasks(orgId: string): Promise<Task[]>;
  createTask(orgId: string, task: Omit<Task, "id" | "organizationId" | "createdAt">): Promise<Task>;
  toggleTaskStatus(orgId: string, id: string): Promise<Task>;
  deleteTask(orgId: string, id: string): Promise<boolean>;

  // Documents & Audit
  getDocuments(orgId: string): Promise<DocumentRecord[]>;
  uploadDocument(orgId: string, doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">): Promise<DocumentRecord>;
  deleteDocument(orgId: string, id: string): Promise<boolean>;
  getAuditLogs(orgId: string): Promise<AuditLog[]>;
  addAuditLog(orgId: string, log: Omit<AuditLog, "id" | "organizationId" | "timestamp">): Promise<AuditLog>;
  getNotifications(orgId: string): Promise<NotificationItem[]>;
}
