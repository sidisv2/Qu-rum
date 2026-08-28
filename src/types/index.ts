export type Role = 'owner' | 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  taxId: string;
  currency: string;
  currencySymbol: string;
  industry: string;
  isDemo?: boolean;
  settings?: Record<string, any>;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  createdAt: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'at_risk' | 'overdue';

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  address?: string;
  status: CustomerStatus;
  notes?: string;
  totalSpent: number;
  totalPendingDebt: number;
  lastPurchaseDate?: string;
  purchaseFrequencyDays?: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  notes?: string;
  totalPaid: number;
  pendingPayment: number;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  category: string;
  cost: number;
  price: number;
  marginAmount: number;
  marginPercent: number;
  stock?: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export type SaleStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface SaleItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  organizationId: string;
  customerId?: string;
  customerName: string;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  supplierId?: string;
  supplierName?: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  documentUrl?: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  documentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export type ReceivableStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Receivable {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  saleId?: string;
  saleNumber?: string;
  amount: number;
  balance: number;
  dueDate: string;
  status: ReceivableStatus;
  overdueDays: number;
  notes?: string;
  payments?: PaymentRecord[];
  createdAt: string;
}

export type PayableStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Payable {
  id: string;
  organizationId: string;
  supplierId: string;
  supplierName: string;
  expenseId?: string;
  amount: number;
  balance: number;
  dueDate: string;
  status: PayableStatus;
  notes?: string;
  payments?: PaymentRecord[];
  createdAt: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuoteItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  quoteNumber: string;
  items: QuoteItem[];
  total: number;
  validUntil: string;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assignedTo?: string;
  status: TaskStatus;
  suggestedByAi?: boolean;
  relatedEntityId?: string;
  relatedEntityType?: 'customer' | 'sale' | 'expense' | 'quote' | 'receivable';
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  organizationId: string;
  name: string;
  fileUrl: string;
  category: 'invoice' | 'receipt' | 'contract' | 'tax' | 'other';
  relatedCustomerId?: string;
  relatedSupplierId?: string;
  docDate: string;
  expiryDate?: string;
  fileSize?: string;
  createdAt: string;
}

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface AIRecommendation {
  id: string;
  organizationId: string;
  category: 'risk' | 'cashflow' | 'expense' | 'quote' | 'customer';
  title: string;
  explanation: string;
  impact: ImpactLevel;
  recommendation: string;
  actionType: 'view_customer' | 'view_quote' | 'view_expense' | 'send_reminder' | 'create_task';
  actionPayload: Record<string, any>;
  status: 'pending' | 'applied' | 'dismissed';
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  basedOnPeriod?: string;
  structuredRecommendations?: AIRecommendation[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  linkTo?: string;
  isRead: boolean;
  createdAt: string;
}
