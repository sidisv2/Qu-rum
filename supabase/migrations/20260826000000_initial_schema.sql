-- DIREX SAAS B2B — ESQUEMA RELACIONAL POSTGRESQL & ROW LEVEL SECURITY (RLS)
-- Migracion Inicial Idempotente y Adaptable

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
    currency_symbol VARCHAR(5) DEFAULT '$',
    industry VARCHAR(100),
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migracion adaptativa si la tabla organizations ya existia previamente
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'legal_name') THEN
        ALTER TABLE public.organizations ADD COLUMN legal_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'tax_id') THEN
        ALTER TABLE public.organizations ADD COLUMN tax_id VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'currency') THEN
        ALTER TABLE public.organizations ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'ARS';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'currency_symbol') THEN
        ALTER TABLE public.organizations ADD COLUMN currency_symbol VARCHAR(5) DEFAULT '$';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'industry') THEN
        ALTER TABLE public.organizations ADD COLUMN industry VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'country') THEN
        ALTER TABLE public.organizations ADD COLUMN country VARCHAR(2) NOT NULL DEFAULT 'AR';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'timezone') THEN
        ALTER TABLE public.organizations ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'is_demo') THEN
        ALTER TABLE public.organizations ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- ============================================================================
-- 2. TABLA: ORGANIZATION_MEMBERS (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- Helper para validacion de membresia en RLS
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. TABLAS MAESTRAS (CUSTOMERS, SUPPLIERS, PRODUCTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    tax_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_sales_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_pending_debt NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(organization_id, name);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    category VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_purchases_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_pending_payable NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON public.suppliers(organization_id);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    cost_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'u',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);

-- ============================================================================
-- 4. TABLAS FINANCIERAS (SALES, SALE_ITEMS, EXPENSES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    sale_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    payment_method VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_sales_org ON public.sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(organization_id, date);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(15,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    payment_method VARCHAR(100),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(organization_id);

-- ============================================================================
-- 5. CUENTAS POR COBRAR, PAGAR Y PAGOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    sale_number VARCHAR(100),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    balance NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    overdue_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_receivables_org ON public.receivables(organization_id);

CREATE TABLE IF NOT EXISTS public.receivable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    idempotency_key VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_rec_payments_rec ON public.receivable_payments(receivable_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_payments_idemp ON public.receivable_payments(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    balance NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_payables_org ON public.payables(organization_id);

CREATE TABLE IF NOT EXISTS public.payable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payable_id UUID NOT NULL REFERENCES public.payables(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    idempotency_key VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_pay_payments_pay ON public.payable_payments(payable_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pay_payments_idemp ON public.payable_payments(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- 6. COTIZACIONES, TAREAS, DOCUMENTOS Y AUDITORIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    quote_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    valid_until DATE NOT NULL,
    total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON public.quotes(organization_id);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(15,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_logs(organization_id);

-- ============================================================================
-- 7. ACTIVACION DE ROW LEVEL SECURITY (RLS)
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

-- Politicas RLS
DROP POLICY IF EXISTS "org_member_read_org" ON public.organizations;
CREATE POLICY "org_member_read_org" ON public.organizations FOR SELECT USING (
    id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "org_member_read_members" ON public.organization_members;
CREATE POLICY "org_member_read_members" ON public.organization_members FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
);

-- Politicas generales por tabla
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['customers', 'suppliers', 'products', 'sales', 'expenses', 'receivables', 'receivable_payments', 'payables', 'payable_payments', 'quotes', 'tasks', 'documents', 'audit_logs'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%I_org_isolation" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "%I_org_isolation" ON public.%I FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id))', t, t);
    END LOOP;
END $$;

-- Sub-tablas
DROP POLICY IF EXISTS "sale_items_org_isolation" ON public.sale_items;
CREATE POLICY "sale_items_org_isolation" ON public.sale_items FOR ALL USING (
    sale_id IN (SELECT id FROM public.sales WHERE public.is_org_member(organization_id))
) WITH CHECK (
    sale_id IN (SELECT id FROM public.sales WHERE public.is_org_member(organization_id))
);

DROP POLICY IF EXISTS "quote_items_org_isolation" ON public.quote_items;
CREATE POLICY "quote_items_org_isolation" ON public.quote_items FOR ALL USING (
    quote_id IN (SELECT id FROM public.quotes WHERE public.is_org_member(organization_id))
) WITH CHECK (
    quote_id IN (SELECT id FROM public.quotes WHERE public.is_org_member(organization_id))
);
