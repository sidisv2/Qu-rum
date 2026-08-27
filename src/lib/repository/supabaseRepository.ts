import { IDataRepository, PaginatedResult, PaginationParams, PaymentParams } from "./types";
import { calculateMargin, safeRound, sanitizeCsvField } from "../utils/formatters";
import { supabase, isSupabaseConfigured } from "../supabase/client";
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

export class SupabaseRepository implements IDataRepository {
  private checkClient() {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error("Supabase client is not configured or missing credentials.");
    }
  }

  async getOrganizations(): Promise<Organization[]> {
    this.checkClient();
    const { data, error } = await supabase!.from("organizations").select("*");
    if (error) throw error;
    return (data || []).map((o: any) => ({
      id: o.id,
      name: o.name,
      taxId: o.tax_id || "",
      currency: o.currency || "ARS",
      currencySymbol: "$",
      industry: o.industry || "General",
      isDemo: o.is_demo || false,
      createdAt: o.created_at
    }));
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("organizations").select("*").eq("id", id).single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      taxId: data.tax_id || "",
      currency: data.currency || "ARS",
      currencySymbol: "$",
      industry: data.industry || "General",
      isDemo: data.is_demo || false,
      createdAt: data.created_at
    };
  }

    async createOrganization(org: Omit<Organization, "id" | "createdAt">): Promise<Organization> {
    this.checkClient();
    
    // Invocar Edge Function transaccional que crea organization y asigna rol Owner
    const { data, error } = await supabase!.functions.invoke("create-organization", {
      body: {
        name: org.name,
        taxId: org.taxId,
        industry: org.industry,
        currency: org.currency || "ARS"
      }
    });

    if (error) {
      throw new Error(error.message || "Error al crear la organización");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    if (data?.organization) {
      return data.organization;
    }

    // Fallback directo
    const { data: directData, error: directError } = await supabase!.from("organizations").insert({
      name: org.name,
      tax_id: org.taxId,
      currency: org.currency || "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      is_demo: org.isDemo || false
    }).select().single();

    if (directError) throw directError;
    return {
      id: directData.id,
      name: directData.name,
      taxId: directData.tax_id,
      currency: directData.currency,
      currencySymbol: "$",
      industry: org.industry,
      isDemo: directData.is_demo,
      createdAt: directData.created_at
    };
  }

  async getCustomers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Customer>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase!.from("customers").select("*", { count: "exact" }).eq("organization_id", orgId).is("deleted_at", null);

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped = (data || []).map((c: any) => ({
      id: c.id,
      organizationId: c.organization_id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      taxId: c.tax_id,
      address: c.address,
      status: c.status,
      totalSpent: Number(c.total_spent) || 0,
      totalPendingDebt: Number(c.total_pending_debt) || 0,
      purchaseFrequencyDays: c.purchase_frequency_days,
      lastPurchaseDate: c.last_purchase_date,
      notes: c.notes,
      createdAt: c.created_at
    }));

    return {
      data: mapped,
      total: count || 0,
      page,
      pageSize
    };
  }

  async getCustomerById(orgId: string, id: string): Promise<Customer | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("customers").select("*").eq("id", id).eq("organization_id", orgId).is("deleted_at", null).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      taxId: data.tax_id,
      address: data.address,
      status: data.status,
      totalSpent: Number(data.total_spent) || 0,
      totalPendingDebt: Number(data.total_pending_debt) || 0,
      purchaseFrequencyDays: data.purchase_frequency_days,
      lastPurchaseDate: data.last_purchase_date,
      notes: data.notes,
      createdAt: data.created_at
    };
  }

  async createCustomer(orgId: string, customer: Omit<Customer, "id" | "organizationId" | "createdAt">): Promise<Customer> {
    this.checkClient();
    const { data, error } = await supabase!.from("customers").insert({
      organization_id: orgId,
      name: customer.name,
      tax_id: customer.taxId,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status || "active",
      notes: customer.notes,
      total_spent: customer.totalSpent || 0,
      total_pending_debt: customer.totalPendingDebt || 0
    }).select().single();

    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      taxId: data.tax_id,
      address: data.address,
      status: data.status,
      totalSpent: Number(data.total_spent),
      totalPendingDebt: Number(data.total_pending_debt),
      createdAt: data.created_at
    };
  }

  async updateCustomer(orgId: string, id: string, data: Partial<Customer>): Promise<Customer> {
    this.checkClient();
    const { data: res, error } = await supabase!.from("customers")
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        notes: data.notes,
        total_spent: data.totalSpent,
        total_pending_debt: data.totalPendingDebt
      })
      .eq("id", id)
      .eq("organization_id", orgId)
      .select().single();

    if (error) throw error;
    return {
      id: res.id,
      organizationId: res.organization_id,
      name: res.name,
      email: res.email,
      phone: res.phone,
      taxId: res.tax_id,
      address: res.address,
      status: res.status,
      totalSpent: Number(res.total_spent),
      totalPendingDebt: Number(res.total_pending_debt),
      createdAt: res.created_at
    };
  }

  async deleteCustomer(orgId: string, id: string): Promise<boolean> {
    this.checkClient();
    const { error } = await supabase!.from("customers").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return true;
  }

  async getSuppliers(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Supplier>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase!.from("suppliers").select("*", { count: "exact" }).eq("organization_id", orgId).is("deleted_at", null);

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped = (data || []).map((s: any) => ({
      id: s.id,
      organizationId: s.organization_id,
      name: s.name,
      contactName: s.contact_name,
      category: s.category || "General",
      email: s.email,
      phone: s.phone,
      totalPaid: Number(s.total_paid) || 0,
      pendingPayment: Number(s.pending_payment) || 0,
      createdAt: s.created_at
    }));

    return {
      data: mapped,
      total: count || 0,
      page,
      pageSize
    };
  }

  async getSupplierById(orgId: string, id: string): Promise<Supplier | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("suppliers").select("*").eq("id", id).eq("organization_id", orgId).is("deleted_at", null).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      contactName: data.contact_name,
      category: data.category || "General",
      email: data.email,
      phone: data.phone,
      totalPaid: Number(data.total_paid) || 0,
      pendingPayment: Number(data.pending_payment) || 0,
      createdAt: data.created_at
    };
  }

  async createSupplier(orgId: string, supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">): Promise<Supplier> {
    this.checkClient();
    const { data, error } = await supabase!.from("suppliers").insert({
      organization_id: orgId,
      name: supplier.name,
      contact_name: supplier.contactName,
      category: supplier.category || "General",
      email: supplier.email,
      phone: supplier.phone
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      contactName: data.contact_name,
      category: data.category || "General",
      email: data.email,
      phone: data.phone,
      totalPaid: Number(data.total_paid) || 0,
      pendingPayment: Number(data.pending_payment) || 0,
      createdAt: data.created_at
    };
  }

  async updateSupplier(orgId: string, id: string, data: Partial<Supplier>): Promise<Supplier> {
    this.checkClient();
    const { data: res, error } = await supabase!.from("suppliers").update(data).eq("id", id).eq("organization_id", orgId).select().single();
    if (error) throw error;
    return res;
  }

  async deleteSupplier(orgId: string, id: string): Promise<boolean> {
    this.checkClient();
    const { error } = await supabase!.from("suppliers").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return true;
  }

  async getProducts(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Product>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase!.from("products").select("*", { count: "exact" }).eq("organization_id", orgId);

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped: Product[] = (data || []).map((p: any) => ({
      id: p.id,
      organizationId: p.organization_id,
      name: p.name,
      sku: p.sku || "",
      category: p.category,
      cost: Number(p.cost) || 0,
      price: Number(p.price) || 0,
      marginAmount: Number(p.margin_amount) || 0,
      marginPercent: Number(p.margin_percent) || 0,
      stock: p.stock || 0,
      status: p.active ? "active" : "archived",
      createdAt: p.created_at
    }));

    return {
      data: mapped,
      total: count || 0,
      page,
      pageSize
    };
  }

  async getProductById(orgId: string, id: string): Promise<Product | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("products").select("*").eq("id", id).eq("organization_id", orgId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      sku: data.sku || "",
      category: data.category,
      cost: Number(data.cost) || 0,
      price: Number(data.price) || 0,
      marginAmount: Number(data.margin_amount) || 0,
      marginPercent: Number(data.margin_percent) || 0,
      stock: data.stock || 0,
      status: data.active ? "active" : "archived",
      createdAt: data.created_at
    };
  }

  async createProduct(orgId: string, product: Omit<Product, "id" | "organizationId" | "createdAt">): Promise<Product> {
    this.checkClient();
    const { data, error } = await supabase!.from("products").insert({
      organization_id: orgId,
      name: product.name,
      sku: product.sku,
      category: product.category,
      cost: product.cost,
      price: product.price,
      margin_amount: product.marginAmount,
      margin_percent: product.marginPercent
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      cost: Number(data.cost),
      price: Number(data.price),
      marginAmount: Number(data.margin_amount),
      marginPercent: Number(data.margin_percent),
      status: "active",
      createdAt: data.created_at
    };
  }

  async updateProduct(orgId: string, id: string, data: Partial<Product>): Promise<Product> {
    this.checkClient();
    const { data: res, error } = await supabase!.from("products").update(data).eq("id", id).eq("organization_id", orgId).select().single();
    if (error) throw error;
    return res;
  }

  async deleteProduct(orgId: string, id: string): Promise<boolean> {
    this.checkClient();
    const { error } = await supabase!.from("products").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return true;
  }

  async getSales(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Sale>> {
    this.checkClient();
    const { data, error } = await supabase!.from("sales").select("*, sale_items(*)").eq("organization_id", orgId).order("sale_date", { ascending: false });
    if (error) throw error;
    const mapped: Sale[] = (data || []).map((s: any) => ({

      id: s.id,
      organizationId: s.organization_id,
      customerId: s.customer_id,
      customerName: s.customer_name,
      saleNumber: s.sale_number,
      items: (s.sale_items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal)
      })),
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      status: s.status,
      paymentStatus: s.payment_status,
      date: s.sale_date,
      createdAt: s.created_at
    }));
    return { data: mapped, total: mapped.length, page: params?.page || 1, pageSize: params?.pageSize || 50 };
  }

  async getSaleById(orgId: string, id: string): Promise<Sale | null> {
    this.checkClient();
    const res = await supabase!.from("sales").select("*, sale_items(*)").eq("id", id).eq("organization_id", orgId).single();
    if (res.error || !res.data) return null;
    const data = res.data;
    return {
      id: data.id,
      organizationId: data.organization_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      saleNumber: data.sale_number,
      items: (data.sale_items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal)
      })),
      subtotal: Number(data.subtotal),
      discount: Number(data.discount),
      tax: Number(data.tax),
      total: Number(data.total),
      status: data.status,
      paymentStatus: data.payment_status,
      date: data.sale_date,
      createdAt: data.created_at
    };
  }

  async createSale(orgId: string, sale: Omit<Sale, "id" | "organizationId" | "createdAt">, idempotencyKey?: string): Promise<Sale> {
    this.checkClient();
    const { data: sData, error: sErr } = await supabase!.from("sales").insert({
      organization_id: orgId,
      customer_id: sale.customerId,
      customer_name: sale.customerName,
      sale_number: sale.saleNumber,
      sale_date: sale.date,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      status: sale.status,
      payment_status: sale.paymentStatus
    }).select().single();

    if (sErr) throw sErr;

    if (sale.items && sale.items.length > 0) {
      const itemsToInsert = sale.items.map(it => ({
        organization_id: orgId,
        sale_id: sData.id,
        product_id: it.productId || null,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        unit_cost: 0,
        subtotal: it.subtotal
      }));
      await supabase!.from("sale_items").insert(itemsToInsert);
    }

    return {
      ...sale,
      id: sData.id,
      organizationId: orgId,
      createdAt: sData.created_at
    };
  }

  async updateSaleStatus(orgId: string, id: string, status: Sale["status"]): Promise<Sale> {
    this.checkClient();
    const { data, error } = await supabase!.from("sales").update({ status }).eq("id", id).eq("organization_id", orgId).select().single();
    if (error) throw error;
    return data;
  }

  async getExpenses(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Expense>> {
    this.checkClient();
    const { data, error } = await supabase!.from("expenses").select("*").eq("organization_id", orgId).order("expense_date", { ascending: false });
    if (error) throw error;
    const mapped: Expense[] = (data || []).map((e: any) => ({

      id: e.id,
      organizationId: e.organization_id,
      supplierId: e.supplier_id,
      supplierName: e.supplier_name,
      category: e.category,
      amount: Number(e.amount),
      date: e.expense_date,
      description: e.description,
      isAnomaly: e.is_anomaly,
      anomalyReason: e.anomaly_reason,
      createdAt: e.created_at
    }));
    return { data: mapped, total: mapped.length, page: params?.page || 1, pageSize: params?.pageSize || 50 };
  }

  async getExpenseById(orgId: string, id: string): Promise<Expense | null> {
    this.checkClient();
    const res = await supabase!.from("expenses").select("*").eq("id", id).eq("organization_id", orgId).single();
    if (res.error || !res.data) return null;
    const data = res.data;
    return {
      id: data.id,
      organizationId: data.organization_id,
      supplierId: data.supplier_id,
      supplierName: data.supplier_name,
      category: data.category,
      amount: Number(data.amount),
      date: data.expense_date,
      description: data.description,
      isAnomaly: data.is_anomaly,
      anomalyReason: data.anomaly_reason,
      createdAt: data.created_at
    };
  }

  async updateExpense(orgId: string, id: string, data: Partial<Expense>): Promise<Expense> {
    this.checkClient();
    const res = await supabase!.from("expenses").update(data).eq("id", id).eq("organization_id", orgId).select().single();
    if (res.error) throw res.error;
    return res.data;
  }

  async createExpense(orgId: string, expense: Omit<Expense, "id" | "organizationId" | "createdAt">): Promise<Expense> {
    this.checkClient();
    const { data, error } = await supabase!.from("expenses").insert({
      organization_id: orgId,
      supplier_id: expense.supplierId || null,
      supplier_name: expense.supplierName,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.date,
      description: expense.description
    }).select().single();
    if (error) throw error;
    return {
      ...expense,
      id: data.id,
      organizationId: orgId,
      createdAt: data.created_at
    };
  }

  async deleteExpense(orgId: string, id: string): Promise<boolean> {
    this.checkClient();
    const { error } = await supabase!.from("expenses").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return true;
  }

  async getReceivables(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Receivable>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase!.from("receivables").select("*, receivable_payments(*)", { count: "exact" }).eq("organization_id", orgId);
    if (params?.search) {
      query = query.or(`customer_name.ilike.%${params.search}%,sale_number.ilike.%${params.search}%`);
    }
    query = query.order("due_date", { ascending: true }).range(from, to);
    const { data, error, count } = await query;
    if (error) throw error;
    const mapped: Receivable[] = (data || []).map((r: any) => ({
      id: r.id,
      organizationId: r.organization_id,
      saleId: r.sale_id,
      saleNumber: r.sale_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      amount: Number(r.amount),
      balance: Number(r.balance),
      dueDate: r.due_date,
      status: r.status,
      overdueDays: r.overdue_days || 0,
      payments: (r.receivable_payments || []).map((p: any) => ({
        id: p.id,
        organizationId: p.organization_id,
        documentId: p.receivable_id,
        amount: Number(p.amount),
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        reference: p.reference,
        notes: p.notes,
        createdBy: p.created_by,
        createdAt: p.created_at
      })),
      createdAt: r.created_at
    }));
    return { data: mapped, total: count || mapped.length, page, pageSize };
  }

  async getReceivableById(orgId: string, id: string): Promise<Receivable | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("receivables").select("*, receivable_payments(*)").eq("id", id).eq("organization_id", orgId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      saleId: data.sale_id,
      saleNumber: data.sale_number,
      customerId: data.customer_id,
      customerName: data.customer_name,
      amount: Number(data.amount),
      balance: Number(data.balance),
      dueDate: data.due_date,
      status: data.status,
      overdueDays: data.overdue_days || 0,
      payments: (data.receivable_payments || []).map((p: any) => ({
        id: p.id,
        organizationId: p.organization_id,
        documentId: p.receivable_id,
        amount: Number(p.amount),
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        reference: p.reference,
        notes: p.notes,
        createdBy: p.created_by,
        createdAt: p.created_at
      })),
      createdAt: data.created_at
    };
  }

  async getReceivablePayments(orgId: string, receivableId: string): Promise<PaymentRecord[]> {
    this.checkClient();
    const { data, error } = await supabase!.from("receivable_payments").select("*").eq("receivable_id", receivableId).eq("organization_id", orgId).order("payment_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id,
      organizationId: p.organization_id,
      documentId: p.receivable_id,
      amount: Number(p.amount),
      paymentDate: p.payment_date,
      paymentMethod: p.payment_method,
      reference: p.reference,
      notes: p.notes,
      createdBy: p.created_by,
      createdAt: p.created_at
    }));
  }

  async recordPaymentReceivable(orgId: string, receivableId: string, payment: PaymentParams): Promise<Receivable> {
    this.checkClient();
    try {
      const { data: rpcRes, error: rpcErr } = await supabase!.rpc("record_receivable_payment_transaction", {
        p_organization_id: orgId,
        p_receivable_id: receivableId,
        p_amount: payment.amount,
        p_payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
        p_payment_method: payment.paymentMethod || "Transferencia",
        p_reference: payment.reference || null,
        p_notes: payment.notes || null,
        p_idempotency_key: payment.idempotencyKey || null
      });
      if (!rpcErr && rpcRes) {
        const updated = await this.getReceivableById(orgId, receivableId);
        if (updated) return updated;
      }
    } catch (e) {
      console.warn("record_receivable_payment_transaction RPC fallback:", e);
    }
    const amount = payment.amount;
    this.checkClient();
    const { data: cur } = await supabase!.from("receivables").select("balance").eq("id", receivableId).single();
    const newBal = Math.max(0, Number(cur?.balance || 0) - amount);
    const { data, error } = await supabase!.from("receivables").update({
      balance: newBal,
      status: newBal === 0 ? "paid" : "partial"
    }).eq("id", receivableId).eq("organization_id", orgId).select().single();

    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      amount: Number(data.amount),
      balance: Number(data.balance),
      dueDate: data.due_date,
      status: data.status,
      overdueDays: data.overdue_days,
      createdAt: data.created_at
    };
  }

  async getPayables(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Payable>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase!.from("payables").select("*, payable_payments(*)", { count: "exact" }).eq("organization_id", orgId);
    if (params?.search) {
      query = query.or(`supplier_name.ilike.%${params.search}%`);
    }
    query = query.order("due_date", { ascending: true }).range(from, to);
    const { data, error, count } = await query;
    if (error) throw error;
    const mapped: Payable[] = (data || []).map((p: any) => ({
      id: p.id,
      organizationId: p.organization_id,
      supplierId: p.supplier_id,
      supplierName: p.supplier_name,
      amount: Number(p.amount),
      balance: Number(p.balance),
      dueDate: p.due_date,
      status: p.status,
      payments: (p.payable_payments || []).map((pay: any) => ({
        id: pay.id,
        organizationId: pay.organization_id,
        documentId: pay.payable_id,
        amount: Number(pay.amount),
        paymentDate: pay.payment_date,
        paymentMethod: pay.payment_method,
        reference: pay.reference,
        notes: pay.notes,
        createdBy: pay.created_by,
        createdAt: pay.created_at
      })),
      createdAt: p.created_at
    }));
    return { data: mapped, total: count || mapped.length, page, pageSize };
  }

  async getPayableById(orgId: string, id: string): Promise<Payable | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("payables").select("*, payable_payments(*)").eq("id", id).eq("organization_id", orgId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      supplierId: data.supplier_id,
      supplierName: data.supplier_name,
      amount: Number(data.amount),
      balance: Number(data.balance),
      dueDate: data.due_date,
      status: data.status,
      payments: (data.payable_payments || []).map((p: any) => ({
        id: p.id,
        organizationId: p.organization_id,
        documentId: p.payable_id,
        amount: Number(p.amount),
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        reference: p.reference,
        notes: p.notes,
        createdBy: p.created_by,
        createdAt: p.created_at
      })),
      createdAt: data.created_at
    };
  }

  async getPayablePayments(orgId: string, payableId: string): Promise<PaymentRecord[]> {
    this.checkClient();
    const { data, error } = await supabase!.from("payable_payments").select("*").eq("payable_id", payableId).eq("organization_id", orgId).order("payment_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id,
      organizationId: p.organization_id,
      documentId: p.payable_id,
      amount: Number(p.amount),
      paymentDate: p.payment_date,
      paymentMethod: p.payment_method,
      reference: p.reference,
      notes: p.notes,
      createdBy: p.created_by,
      createdAt: p.created_at
    }));
  }

  async recordPaymentPayable(orgId: string, payableId: string, payment: PaymentParams): Promise<Payable> {
    this.checkClient();
    try {
      const { data: rpcRes, error: rpcErr } = await supabase!.rpc("record_payable_payment_transaction", {
        p_organization_id: orgId,
        p_payable_id: payableId,
        p_amount: payment.amount,
        p_payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
        p_payment_method: payment.paymentMethod || "Transferencia",
        p_reference: payment.reference || null,
        p_notes: payment.notes || null,
        p_idempotency_key: payment.idempotencyKey || null
      });
      if (!rpcErr && rpcRes) {
        const updated = await this.getPayableById(orgId, payableId);
        if (updated) return updated;
      }
    } catch (e) {
      console.warn("record_payable_payment_transaction RPC fallback:", e);
    }
    const amount = payment.amount;
    this.checkClient();
    const { data: cur } = await supabase!.from("payables").select("balance").eq("id", payableId).single();
    const newBal = Math.max(0, Number(cur?.balance || 0) - amount);
    const { data, error } = await supabase!.from("payables").update({
      balance: newBal,
      status: newBal === 0 ? "paid" : "partial"
    }).eq("id", payableId).eq("organization_id", orgId).select().single();

    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      supplierId: data.supplier_id,
      supplierName: data.supplier_name,
      amount: Number(data.amount),
      balance: Number(data.balance),
      dueDate: data.due_date,
      status: data.status,
      createdAt: data.created_at
    };
  }

  async getQuotes(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Quote>> {
    this.checkClient();
    const { data, error } = await supabase!.from("quotes").select("*, quote_items(*)").eq("organization_id", orgId);
    if (error) throw error;
    const mapped: Quote[] = (data || []).map((q: any) => ({

      id: q.id,
      organizationId: q.organization_id,
      customerId: q.customer_id,
      customerName: q.customer_name,
      quoteNumber: q.quote_number,
      total: Number(q.total),
      validUntil: q.valid_until,
      status: q.status,
      items: (q.quote_items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal)
      })),
      createdAt: q.created_at
    }));
    return { data: mapped, total: mapped.length, page: params?.page || 1, pageSize: params?.pageSize || 50 };
  }

  async getQuoteById(orgId: string, id: string): Promise<Quote | null> {
    this.checkClient();
    const res = await supabase!.from("quotes").select("*, quote_items(*)").eq("id", id).eq("organization_id", orgId).single();
    if (res.error || !res.data) return null;
    const data = res.data;
    return {
      id: data.id,
      organizationId: data.organization_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      quoteNumber: data.quote_number,
      total: Number(data.total),
      validUntil: data.valid_until,
      status: data.status,
      items: (data.quote_items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal)
      })),
      createdAt: data.created_at
    };
  }

  async createQuote(orgId: string, quote: Omit<Quote, "id" | "organizationId" | "createdAt">): Promise<Quote> {
    this.checkClient();
    const { data, error } = await supabase!.from("quotes").insert({
      organization_id: orgId,
      customer_id: quote.customerId,
      customer_name: quote.customerName,
      quote_number: quote.quoteNumber,
      total: quote.total,
      valid_until: quote.validUntil,
      status: quote.status
    }).select().single();
    if (error) throw error;
    return { ...quote, id: data.id, organizationId: orgId, createdAt: data.created_at };
  }

  async updateQuoteStatus(orgId: string, id: string, status: Quote["status"]): Promise<Quote> {
    this.checkClient();
    const { data, error } = await supabase!.from("quotes").update({ status }).eq("id", id).eq("organization_id", orgId).select().single();
    if (error) throw error;
    return data;
  }

  async getTasks(orgId: string, params?: PaginationParams): Promise<PaginatedResult<Task>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase!.from("tasks").select("*", { count: "exact" }).eq("organization_id", orgId);

    if (params?.search) {
      query = query.or("title.ilike.%" + params.search + "%,description.ilike.%" + params.search + "%");
    }
    if (params?.status) {
      query = query.eq("status", params.status);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped: Task[] = (data || []).map((t: any) => ({
      id: t.id,
      organizationId: t.organization_id,
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      dueDate: t.due_date,
      assignedTo: t.assigned_to,
      status: t.status,
      createdAt: t.created_at
    }));

    return {
      data: mapped,
      total: count || mapped.length,
      page,
      pageSize
    };
  }

  async getTaskById(orgId: string, id: string): Promise<Task | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("tasks").select("*").eq("id", id).eq("organization_id", orgId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      dueDate: data.due_date,
      assignedTo: data.assigned_to,
      status: data.status,
      createdAt: data.created_at
    };
  }

  async createTask(orgId: string, task: Omit<Task, "id" | "organizationId" | "createdAt">): Promise<Task> {
    this.checkClient();
    const { data, error } = await supabase!.from("tasks").insert({
      organization_id: orgId,
      title: sanitizeCsvField(task.title),
      description: task.description || null,
      priority: task.priority || "medium",
      due_date: task.dueDate,
      assigned_to: task.assignedTo || null,
      status: task.status || "pending"
    }).select().single();

    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      dueDate: data.due_date,
      assignedTo: data.assigned_to,
      status: data.status,
      createdAt: data.created_at
    };
  }

  async updateTask(orgId: string, id: string, data: Partial<Task>): Promise<Task> {
    this.checkClient();
    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = sanitizeCsvField(data.title);
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.dueDate !== undefined) updatePayload.due_date = data.dueDate;
    if (data.assignedTo !== undefined) updatePayload.assigned_to = data.assignedTo;
    if (data.status !== undefined) updatePayload.status = data.status;

    const { data: updated, error } = await supabase!.from("tasks").update(updatePayload).eq("id", id).eq("organization_id", orgId).select().single();
    if (error) throw error;
    return {
      id: updated.id,
      organizationId: updated.organization_id,
      title: updated.title,
      description: updated.description || "",
      priority: updated.priority,
      dueDate: updated.due_date,
      assignedTo: updated.assigned_to,
      status: updated.status,
      createdAt: updated.created_at
    };
  }

  async toggleTaskStatus(orgId: string, id: string): Promise<Task> {
    const cur = await this.getTaskById(orgId, id);
    if (!cur) throw new Error("Task not found");
    const nextStatus = cur.status === "completed" ? "pending" : "completed";
    return this.updateTask(orgId, id, { status: nextStatus });
  }

  async deleteTask(orgId: string, id: string): Promise<boolean> {
    this.checkClient();
    const { error } = await supabase!.from("tasks").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return true;
  }

  async getDocuments(orgId: string, params?: PaginationParams): Promise<PaginatedResult<DocumentRecord>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase!.from("documents").select("*", { count: "exact" }).eq("organization_id", orgId);

    if (params?.search) {
      query = query.ilike("name", "%" + params.search + "%");
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped: DocumentRecord[] = (data || []).map((d: any) => ({
      id: d.id,
      organizationId: d.organization_id,
      name: d.name,
      fileUrl: d.storage_path,
      category: d.category || "other",
      relatedCustomerId: d.related_customer_id,
      relatedSupplierId: d.related_supplier_id,
      docDate: d.doc_date || d.created_at.split("T")[0],
      fileSize: d.size_bytes ? Math.round(d.size_bytes / 1024) + " KB" : undefined,
      createdAt: d.created_at
    }));

    return {
      data: mapped,
      total: count || mapped.length,
      page,
      pageSize
    };
  }

  async getDocumentById(orgId: string, id: string): Promise<DocumentRecord | null> {
    this.checkClient();
    const { data, error } = await supabase!.from("documents").select("*").eq("id", id).eq("organization_id", orgId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      fileUrl: data.storage_path,
      category: data.category || "other",
      relatedCustomerId: data.related_customer_id,
      relatedSupplierId: data.related_supplier_id,
      docDate: data.doc_date || data.created_at.split("T")[0],
      fileSize: data.size_bytes ? Math.round(data.size_bytes / 1024) + " KB" : undefined,
      createdAt: data.created_at
    };
  }

  async createDocumentMetadata(orgId: string, doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">): Promise<DocumentRecord> {
    this.checkClient();
    const { data, error } = await supabase!.from("documents").insert({
      organization_id: orgId,
      name: sanitizeCsvField(doc.name),
      type: doc.category || "document",
      category: doc.category || "other",
      size_bytes: 0,
      storage_path: doc.fileUrl,
      doc_date: doc.docDate || new Date().toISOString().split("T")[0],
      related_customer_id: doc.relatedCustomerId || null,
      related_supplier_id: doc.relatedSupplierId || null
    }).select().single();

    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      fileUrl: data.storage_path,
      category: data.category || "other",
      relatedCustomerId: data.related_customer_id,
      relatedSupplierId: data.related_supplier_id,
      docDate: data.doc_date,
      createdAt: data.created_at
    };
  }

  async deleteDocument(orgId: string, id: string): Promise<boolean> {
    this.checkClient();
    const { error } = await supabase!.from("documents").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return true;
  }

  async getAuditLogs(orgId: string, params?: PaginationParams): Promise<PaginatedResult<AuditLog>> {
    this.checkClient();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase!.from("audit_logs").select("*", { count: "exact" }).eq("organization_id", orgId);

    if (params?.search) {
      query = query.or("action.ilike.%" + params.search + "%,details.ilike.%" + params.search + "%");
    }

    query = query.order("timestamp", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped: AuditLog[] = (data || []).map((a: any) => ({
      id: a.id,
      organizationId: a.organization_id,
      userId: a.user_id || "sistema",
      userName: a.user_name || "Usuario",
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      details: a.details,
      timestamp: a.timestamp
    }));

    return {
      data: mapped,
      total: count || mapped.length,
      page,
      pageSize
    };
  }

  async addAuditLog(orgId: string, log: Omit<AuditLog, "id" | "organizationId" | "timestamp">): Promise<AuditLog> {
    this.checkClient();
    const { data, error } = await supabase!.from("audit_logs").insert({
      organization_id: orgId,
      user_id: log.userId && log.userId !== "usr-local" ? log.userId : null,
      user_name: log.userName || "Usuario",
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId && log.entityId.length === 36 ? log.entityId : null,
      details: log.details
    }).select().single();

    if (error) throw error;
    return {
      id: data.id,
      organizationId: data.organization_id,
      userId: data.user_id || "sistema",
      userName: data.user_name || "Usuario",
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      details: data.details,
      timestamp: data.timestamp
    };
  }

    async getNotifications(orgId: string): Promise<NotificationItem[]> {
    return [];
  }
}
