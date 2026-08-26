# CONTRATO DEL REPOSITORIO DE DATOS — DIREX (`IDataRepository`)

## 1. Principio Arquitectónico
Toda interacción de datos en Direx está desacoplada de la base de datos subyacente mediante la interfaz `IDataRepository`.

```
[ UI React Views ] ──> [ useOrg() / OrgContext ] ──> [ IDataRepository ]
                                                            │
                                            ┌───────────────┴───────────────┐
                                            ▼                               ▼
                                  [ LocalRepository ]             [ SupabaseRepository ]
                                   (Modo Demo / Offline)           (PostgreSQL 16 Cloud)
```

---

## 2. Definición del Contrato (`src/lib/repository/types.ts`)

```typescript
export interface IDataRepository {
  // Organizations
  getOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: string): Promise<Organization | null>;
  createOrganization(org: Omit<Organization, "id" | "createdAt">): Promise<Organization>;

  // Customers (Soft delete)
  getCustomers(orgId: string): Promise<Customer[]>;
  createCustomer(orgId: string, customer: Omit<Customer, "id" | "organizationId" | "createdAt">): Promise<Customer>;
  updateCustomer(orgId: string, id: string, data: Partial<Customer>): Promise<Customer>;
  deleteCustomer(orgId: string, id: string): Promise<boolean>;

  // Suppliers (Soft delete)
  getSuppliers(orgId: string): Promise<Supplier[]>;
  createSupplier(orgId: string, supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">): Promise<Supplier>;
  updateSupplier(orgId: string, id: string, data: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(orgId: string, id: string): Promise<boolean>;

  // Products
  getProducts(orgId: string): Promise<Product[]>;
  createProduct(orgId: string, product: Omit<Product, "id" | "organizationId" | "createdAt">): Promise<Product>;
  updateProduct(orgId: string, id: string, data: Partial<Product>): Promise<Product>;
  deleteProduct(orgId: string, id: string): Promise<boolean>;

  // Sales & Sale Items
  getSales(orgId: string): Promise<Sale[]>;
  createSale(orgId: string, sale: Omit<Sale, "id" | "organizationId" | "createdAt">): Promise<Sale>;
  updateSaleStatus(orgId: string, id: string, status: Sale["status"]): Promise<Sale>;

  // Expenses
  getExpenses(orgId: string): Promise<Expense[]>;
  createExpense(orgId: string, expense: Omit<Expense, "id" | "organizationId" | "createdAt">): Promise<Expense>;
  deleteExpense(orgId: string, id: string): Promise<boolean>;

  // Receivables & Payables
  getReceivables(orgId: string): Promise<Receivable[]>;
  recordPaymentReceivable(orgId: string, receivableId: string, amount: number): Promise<Receivable>;
  getPayables(orgId: string): Promise<Payable[]>;
  recordPaymentPayable(orgId: string, payableId: string, amount: number): Promise<Payable>;

  // Quotes & Tasks
  getQuotes(orgId: string): Promise<Quote[]>;
  createQuote(orgId: string, quote: Omit<Quote, "id" | "organizationId" | "createdAt">): Promise<Quote>;
  updateQuoteStatus(orgId: string, id: string, status: Quote["status"]): Promise<Quote>;
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
```
