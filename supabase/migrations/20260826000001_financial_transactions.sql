-- Migration: 20260826000001_financial_transactions.sql
-- Subfase 4D.3: Transacciones atomicas de Ventas y Presupuestos con recalculo de importes en PostgreSQL

-- Asegurar columna idempotency_key en sales si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'idempotency_key') THEN
        ALTER TABLE public.sales ADD COLUMN idempotency_key VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'sale_date') THEN
        ALTER TABLE public.sales ADD COLUMN sale_date DATE;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_idemp ON public.sales(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION create_sale_transaction(
    p_organization_id UUID,
    p_customer_id UUID,
    p_customer_name TEXT,
    p_sale_number TEXT,
    p_sale_date DATE,
    p_discount NUMERIC(15,2),
    p_status TEXT,
    p_payment_status TEXT,
    p_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_subtotal NUMERIC(15,2) := 0;
    v_total NUMERIC(15,2) := 0;
    v_item RECORD;
    v_item_subtotal NUMERIC(15,2);
    v_qty NUMERIC(15,2);
    v_price NUMERIC(15,2);
    v_cost NUMERIC(15,2);
    v_prod_id UUID;
    v_desc TEXT;
    v_created_at TIMESTAMPTZ := now();
    v_existing_sale_id UUID;
BEGIN
    -- 1. Validar autorizacion de tenant mediante RLS
    IF NOT is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'Acceso denegado a la organizacion especificada';
    END IF;

    -- 2. Idempotencia: Verificar si la clave ya existe
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key != '' THEN
        SELECT id INTO v_existing_sale_id FROM sales 
        WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
        
        IF v_existing_sale_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'id', v_existing_sale_id,
                'status', 'idempotent_duplicate',
                'message', 'Venta ya procesada previamente con esta idempotency_key'
            );
        END IF;
    END IF;

    -- 3. Calcular subtotal de forma deterministica a partir de los items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        description TEXT,
        quantity NUMERIC(15,2),
        unit_price NUMERIC(15,2)
    )
    LOOP
        v_qty := COALESCE(v_item.quantity, 1);
        v_price := COALESCE(v_item.unit_price, 0);
        v_item_subtotal := round(v_qty * v_price, 2);
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    v_total := round(v_subtotal - COALESCE(p_discount, 0), 2);
    IF v_total < 0 THEN
        v_total := 0;
    END IF;

    -- 4. Insertar cabecera de Venta
    INSERT INTO sales (
        organization_id,
        customer_id,
        customer_name,
        sale_number,
        sale_date,
        subtotal,
        discount,
        tax,
        total,
        status,
        payment_status,
        idempotency_key,
        created_at,
        updated_at
    ) VALUES (
        p_organization_id,
        p_customer_id,
        p_customer_name,
        p_sale_number,
        COALESCE(p_sale_date, CURRENT_DATE),
        v_subtotal,
        COALESCE(p_discount, 0),
        0.00,
        v_total,
        COALESCE(p_status, 'confirmed'),
        COALESCE(p_payment_status, 'unpaid'),
        p_idempotency_key,
        v_created_at,
        v_created_at
    ) RETURNING id INTO v_sale_id;

    -- 5. Insertar lineas de venta
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        description TEXT,
        quantity NUMERIC(15,2),
        unit_price NUMERIC(15,2)
    )
    LOOP
        v_qty := COALESCE(v_item.quantity, 1);
        v_price := COALESCE(v_item.unit_price, 0);
        v_item_subtotal := round(v_qty * v_price, 2);

        INSERT INTO sale_items (
            sale_id,
            product_id,
            description,
            quantity,
            unit_price,
            subtotal
        ) VALUES (
            v_sale_id,
            v_item.product_id,
            v_item.description,
            v_qty,
            v_price,
            v_item_subtotal
        );
    END LOOP;

    -- 6. Si el pago es parcial o pendiente, crear o actualizar la Cuenta por Cobrar (Receivable)
    IF p_payment_status IN ('unpaid', 'partial') AND v_total > 0 THEN
        INSERT INTO receivables (
            organization_id,
            sale_id,
            sale_number,
            customer_id,
            customer_name,
            amount,
            balance,
            due_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            p_organization_id,
            v_sale_id,
            p_sale_number,
            p_customer_id,
            p_customer_name,
            v_total,
            v_total,
            CURRENT_DATE + INTERVAL '30 days',
            'pending',
            v_created_at,
            v_created_at
        );
    END IF;

    -- 7. Retornar el resultado estructurado
    RETURN jsonb_build_object(
        'sale_id', v_sale_id,
        'organization_id', p_organization_id,
        'sale_number', p_sale_number,
        'subtotal', v_subtotal,
        'total', v_total,
        'status', COALESCE(p_status, 'confirmed'),
        'payment_status', COALESCE(p_payment_status, 'unpaid')
    );
END;
$$;
