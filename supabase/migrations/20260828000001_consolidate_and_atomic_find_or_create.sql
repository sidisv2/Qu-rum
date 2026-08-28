-- =========================================================================
-- MIGRACIÓN 2: Consolidación de duplicados, Unique Indexes y RPCs find_or_create
-- =========================================================================

-- 1. Consolidación segura de duplicados en customers (preservando historial)
DO $$
DECLARE
  r RECORD;
  v_canonical_id UUID;
  v_dup_ids UUID[];
BEGIN
  FOR r IN (
    SELECT organization_id, lower(trim(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
    FROM public.customers
    WHERE deleted_at IS NULL
    GROUP BY organization_id, lower(trim(name))
    HAVING count(*) > 1
  ) LOOP
    v_canonical_id := r.ids[1];
    v_dup_ids := r.ids[2:array_length(r.ids, 1)];

    -- 1. Reasignar sales
    UPDATE public.sales
    SET customer_id = v_canonical_id
    WHERE customer_id = ANY(v_dup_ids);

    -- 2. Reasignar receivables
    UPDATE public.receivables
    SET customer_id = v_canonical_id
    WHERE customer_id = ANY(v_dup_ids);

    -- 3. Reasignar quotes
    UPDATE public.quotes
    SET customer_id = v_canonical_id
    WHERE customer_id = ANY(v_dup_ids);

    -- 4. Soft-delete de los duplicados para preservar trazabilidad
    UPDATE public.customers
    SET deleted_at = timezone('utc'::text, now())
    WHERE id = ANY(v_dup_ids);
  END LOOP;
END $$;

-- 2. Unique index funcional por organization_id y lower(trim(name))
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_normalized_name 
ON public.customers (organization_id, lower(trim(name))) 
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_org_normalized_name 
ON public.suppliers (organization_id, lower(trim(name))) 
WHERE deleted_at IS NULL;

-- 3. RPC find_or_create_customer con ON CONFLICT y validación de membership
CREATE OR REPLACE FUNCTION public.find_or_create_customer(
  p_organization_id UUID,
  p_identifier_or_name TEXT,
  p_tax_id TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_address TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_caller_user_id UUID;
  v_caller_role VARCHAR(50);
  v_is_uuid BOOLEAN;
  v_clean_id UUID;
  v_normalized_name TEXT;
  v_customer public.customers%ROWTYPE;
BEGIN
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id AND user_id = v_caller_user_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Acceso no autorizado: El usuario no pertenece a la organización %', p_organization_id
      USING ERRCODE = '42501';
  END IF;

  v_is_uuid := (p_identifier_or_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

  IF v_is_uuid THEN
    v_clean_id := p_identifier_or_name::UUID;
    SELECT * INTO v_customer
    FROM public.customers
    WHERE organization_id = p_organization_id AND id = v_clean_id AND deleted_at IS NULL;

    IF v_customer.id IS NOT NULL THEN
      RETURN to_jsonb(v_customer);
    ELSE
      RAISE EXCEPTION 'UUID de cliente % no encontrado en la organización %', p_identifier_or_name, p_organization_id
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  v_normalized_name := trim(p_identifier_or_name);
  IF v_normalized_name = '' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_customer
  FROM public.customers
  WHERE organization_id = p_organization_id 
    AND lower(trim(name)) = lower(v_normalized_name)
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_customer.id IS NOT NULL THEN
    RETURN to_jsonb(v_customer);
  END IF;

  INSERT INTO public.customers (
    organization_id,
    name,
    tax_id,
    email,
    phone,
    address,
    is_active,
    total_sales_amount,
    total_pending_debt
  ) VALUES (
    p_organization_id,
    v_normalized_name,
    COALESCE(p_tax_id, ''),
    COALESCE(p_email, ''),
    COALESCE(p_phone, ''),
    COALESCE(p_address, ''),
    TRUE,
    0.00,
    0.00
  )
  ON CONFLICT (organization_id, lower(trim(name))) WHERE deleted_at IS NULL
  DO UPDATE SET updated_at = timezone('utc'::text, now())
  RETURNING * INTO v_customer;

  RETURN to_jsonb(v_customer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.find_or_create_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_or_create_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. RPC find_or_create_supplier con ON CONFLICT y validación de membership
CREATE OR REPLACE FUNCTION public.find_or_create_supplier(
  p_organization_id UUID,
  p_identifier_or_name TEXT,
  p_email TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_category TEXT DEFAULT 'General'
)
RETURNS JSONB AS $$
DECLARE
  v_caller_user_id UUID;
  v_caller_role VARCHAR(50);
  v_is_uuid BOOLEAN;
  v_clean_id UUID;
  v_normalized_name TEXT;
  v_supplier public.suppliers%ROWTYPE;
BEGIN
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id AND user_id = v_caller_user_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Acceso no autorizado: El usuario no pertenece a la organización %', p_organization_id
      USING ERRCODE = '42501';
  END IF;

  v_is_uuid := (p_identifier_or_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

  IF v_is_uuid THEN
    v_clean_id := p_identifier_or_name::UUID;
    SELECT * INTO v_supplier
    FROM public.suppliers
    WHERE organization_id = p_organization_id AND id = v_clean_id AND deleted_at IS NULL;

    IF v_supplier.id IS NOT NULL THEN
      RETURN to_jsonb(v_supplier);
    ELSE
      RAISE EXCEPTION 'UUID de proveedor % no encontrado en la organización %', p_identifier_or_name, p_organization_id
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  v_normalized_name := trim(p_identifier_or_name);
  IF v_normalized_name = '' OR lower(v_normalized_name) = 'varios' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_supplier
  FROM public.suppliers
  WHERE organization_id = p_organization_id 
    AND lower(trim(name)) = lower(v_normalized_name)
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_supplier.id IS NOT NULL THEN
    RETURN to_jsonb(v_supplier);
  END IF;

  INSERT INTO public.suppliers (
    organization_id,
    name,
    contact_name,
    email,
    phone,
    category,
    is_active,
    total_purchases_amount,
    total_pending_debt
  ) VALUES (
    p_organization_id,
    v_normalized_name,
    v_normalized_name,
    COALESCE(p_email, ''),
    COALESCE(p_phone, ''),
    COALESCE(p_category, 'General'),
    TRUE,
    0.00,
    0.00
  )
  ON CONFLICT (organization_id, lower(trim(name))) WHERE deleted_at IS NULL
  DO UPDATE SET updated_at = timezone('utc'::text, now())
  RETURNING * INTO v_supplier;

  RETURN to_jsonb(v_supplier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.find_or_create_supplier(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_or_create_supplier(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
