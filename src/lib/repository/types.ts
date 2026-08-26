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

export interface PaymentParams {
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface IDataRepository {
  // Organizations
  getOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: string): Promise<Organization | null>;
  createOrganization(org: Omit<Organization, "id" | "createdAt">): Promise<Organization>;

  // Customers
  getCustomers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Customer>>;
  getCustomerById(orgId: string, id: string): Promise<Customer | null>;
  createCustomer(orgId: string, customer: Omit<Customer, "id" | "organizationId" | "createdAt">): Promise<Customer>;
  updateCustomer(orgId: string, id: string, data: Partial<Customer>): Promise<Customer>;
  deleteCustomer(orgId: string, id: string): Promise<boolean>;

  // Suppliers
  getSuppliers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Supplier>>;
  getSupplierById(orgId: string, id: string): Promise<Supplier | null>;
  createSupplier(orgId: string, supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">): Promise<Supplier>;
  updateSupplier(orgId: string, id: string, data: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(orgId: string, id: string): Promise<boolean>;

  // Products
  getProducts(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Product>>;
  getProductById(orgId: string, id: string): Promise<Product | null>;
  createProduct(orgId: string, product: Omit<Product, "id" | "organizationId" | "createdAt">): Promise<Product>;
  updateProduct(orgId: string, id: string, data: Partial<Product>): Promise<Product>;
  deleteProduct(orgId: string, id: string): Promise<boolean>;

  // Sales
  getSales(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Sale>>;
  getSaleById(orgId: string, id: string): Promise<Sale | null>;
  createSale(orgId: string, sale: Omit<Sale, "id" | "organizationId" | "createdAt">, idempotencyKey?: string): Promise<Sale>;
  updateSaleStatus(orgId: string, id: string, status: Sale["status"]): Promise<Sale>;

  // Expenses
  getExpenses(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Expense>>;
  getExpenseById(orgId: string, id: string): Promise<Expense | null>;
  createExpense(orgId: string, expense: Omit<Expense, "id" | "organizationId" | "createdAt">): Promise<Expense>;
  updateExpense(orgId: string, id: string, data: Partial<Expense>): Promise<Expense>;
  deleteExpense(orgId: string, id: string): Promise<boolean>;

  // Quotes
  getQuotes(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Quote>>;
  getQuoteById(orgId: string, id: string): Promise<Quote | null>;
  createQuote(orgId: string, quote: Omit<Quote, "id" | "organizationId" | "createdAt">): Promise<Quote>;
  updateQuoteStatus(orgId: string, id: string, status: Quote["status"]): Promise<Quote>;

  // Receivables & Payments
  getReceivables(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Receivable>>;
  getReceivableById(orgId: string, id: string): Promise<Receivable | null>;
  getReceivablePayments(orgId: string, receivableId: string): Promise<PaymentRecord[]>;
  recordPaymentReceivable(orgId: string, receivableId: string, payment: PaymentParams): Promise<Receivable>;

  // Payables & Payments
  getPayables(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Payable>>;
  getPayableById(orgId: string, id: string): Promise<Payable | null>;
  getPayablePayments(orgId: string, payableId: string): Promise<PaymentRecord[]>;
  recordPaymentPayable(orgId: string, payableId: string, payment: PaymentParams): Promise<Payable>;

  // Tasks (Subfase 4D.5)
  getTasks(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Task>>;
  getTaskById(orgId: string, id: string): Promise<Task | null>;
  createTask(orgId: string, task: Omit<Task, "id" | "organizationId" | "createdAt">): Promise<Task>;
  updateTask(orgId: string, id: string, data: Partial<Task>): Promise<Task>;
  toggleTaskStatus(orgId: string, id: string): Promise<Task>;
  deleteTask(orgId: string, id: string): Promise<boolean>;

  // Documents & Storage Metadata (Subfase 4D.5)
  getDocuments(orgId: string, params?: PaginationParams): Promise<PaginatedResult<DocumentRecord>>;
  getDocumentById(orgId: string, id: string): Promise<DocumentRecord | null>;
  createDocumentMetadata(orgId: string, doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">): Promise<DocumentRecord>;
  deleteDocument(orgId: string, id: string): Promise<boolean>;

  // Audit Logs (Subfase 4D.5 - Append Only)
  getAuditLogs(orgId: string, params?: PaginationParams): Promise<PaginatedResult<AuditLog>>;
  addAuditLog(orgId: string, log: Omit<AuditLog, "id" | "organizationId" | "timestamp">): Promise<AuditLog>;

  // Notifications
  getNotifications(orgId: string): Promise<NotificationItem[]>;
}
