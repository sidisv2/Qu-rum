-- DIREX SAAS B2B — ESQUEMA RELACIONAL POSTGRESQL & ROW LEVEL SECURITY (RLS)
-- Migración Inicial Idempotente

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLA: ORGANIZATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(2) NOT NULL DEFAULT 'AR',
    currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 2. TABLA: ORGANIZATION_MEMBERS (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

-- ============================================================================
-- 3. FUNCIONES DE SEGURIDAD RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 4. TABLA: CUSTOMERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'at_risk', 'overdue')),
    total_spent NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
    total_pending_debt NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_pending_debt >= 0),
    purchase_frequency_days INT NOT NULL DEFAULT 30,
    last_purchase_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 5. TABLA: SUPPLIERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    total_paid NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_paid >= 0),
    pending_payment NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (pending_payment >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 6. TABLA: PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    cost NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    margin_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    margin_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    stock INT DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 7. TABLA: SALES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    sale_number VARCHAR(50) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    tax NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    total NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 8. TABLA: SALE_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    unit_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0)
);

-- ============================================================================
-- 9. TABLA: EXPENSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled')),
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 10. TABLA: RECEIVABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    sale_number VARCHAR(50),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    balance NUMERIC(15,2) NOT NULL CHECK (balance >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    overdue_days INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 11. TABLA: RECEIVABLE_PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receivable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'Transferencia',
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 12. TABLA: PAYABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    balance NUMERIC(15,2) NOT NULL CHECK (balance >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 13. TABLA: PAYABLE_PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payable_id UUID NOT NULL REFERENCES public.payables(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'Transferencia',
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 14. TABLA: QUOTES & QUOTE_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    quote_number VARCHAR(50) NOT NULL,
    total NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0)
);

-- ============================================================================
-- 15. TABLA: TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date DATE,
    assigned_to UUID,
    suggested_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 16. TABLA: DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    category VARCHAR(100),
    storage_path TEXT,
    file_size VARCHAR(50),
    mime_type VARCHAR(100),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 17. TABLA: AUDIT_LOGS (INMUTABLE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 18. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 19. POLÍTICAS RLS ESPECÍFICAS
-- ============================================================================

-- Organizations
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
USING (public.is_org_member(id));

CREATE POLICY "Owners and admins can update their organization"
ON public.organizations FOR UPDATE
USING (public.is_org_admin(id));

-- Organization Members
CREATE POLICY "Users can view members of their organization"
ON public.organization_members FOR SELECT
USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can manage organization members"
ON public.organization_members FOR ALL
USING (public.is_org_admin(organization_id));

-- Customers
CREATE POLICY "Org members can view customers"
ON public.customers FOR SELECT
USING (public.is_org_member(organization_id) AND deleted_at IS NULL);

CREATE POLICY "Org members can insert customers"
ON public.customers FOR INSERT
WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update customers"
ON public.customers FOR UPDATE
USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can delete customers"
ON public.customers FOR DELETE
USING (public.is_org_admin(organization_id));

-- Suppliers
CREATE POLICY "Org members can view suppliers" ON public.suppliers FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members can update suppliers" ON public.suppliers FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE USING (public.is_org_admin(organization_id));

-- Products
CREATE POLICY "Org members can view products" ON public.products FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert products" ON public.products FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members can update products" ON public.products FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.is_org_admin(organization_id));

-- Sales & Sale Items
CREATE POLICY "Org members can view sales" ON public.sales FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert sales" ON public.sales FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members can update sales" ON public.sales FOR UPDATE USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can view sale_items" ON public.sale_items FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert sale_items" ON public.sale_items FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- Expenses
CREATE POLICY "Org members can view expenses" ON public.expenses FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert expenses" ON public.expenses FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (public.is_org_admin(organization_id));

-- Receivables & Payments
CREATE POLICY "Org members can view receivables" ON public.receivables FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage receivables" ON public.receivables FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can view receivable_payments" ON public.receivable_payments FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert receivable_payments" ON public.receivable_payments FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- Payables & Payments
CREATE POLICY "Org members can view payables" ON public.payables FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage payables" ON public.payables FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can view payable_payments" ON public.payable_payments FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert payable_payments" ON public.payable_payments FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- Quotes & Quote Items
CREATE POLICY "Org members can view quotes" ON public.quotes FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage quotes" ON public.quotes FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can view quote_items" ON public.quote_items FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage quote_items" ON public.quote_items FOR ALL USING (public.is_org_member(organization_id));

-- Tasks
CREATE POLICY "Org members can view tasks" ON public.tasks FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage tasks" ON public.tasks FOR ALL USING (public.is_org_member(organization_id));

-- Documents
CREATE POLICY "Org members can view documents" ON public.documents FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can insert documents" ON public.documents FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE USING (public.is_org_admin(organization_id));

-- Audit Logs (Solo lectura y creación; nunca modificación ni borrado)
CREATE POLICY "Org members can view audit_logs" ON public.audit_logs FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- ============================================================================
-- 20. ÍNDICES DE RENDIMIENTO MULTI-TENANT
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_org_status ON public.customers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_org_date ON public.sales(organization_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_org_customer ON public.sales(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON public.expenses(organization_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_receivables_org_due ON public.receivables(organization_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_payables_org_due ON public.payables(organization_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_quotes_org_status ON public.quotes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_org_status ON public.tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON public.audit_logs(organization_id, created_at DESC);
