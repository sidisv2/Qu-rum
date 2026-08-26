-- Migration: 20260826000001_financial_transactions.sql
-- Subfase 4D.3: Transacciones atómicas de Ventas y Presupuestos con recálculo de importes en PostgreSQL

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
    -- 1. Validar autorización de tenant mediante RLS
    IF NOT is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'Acceso denegado a la organización especificada';
    END IF;

    -- 2. Idempotencia: Verificar si la clave ya existe
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key != '' THEN
        SELECT id INTO v_existing_sale_id FROM sales 
        WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
        
        IF v_existing_sale_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'id', v_existing_sale_id,
                'status', 'idempotent_replay'
            );
        END IF;
    END IF;

    -- 3. Calcular subtotal de las líneas en servidor para evitar fraude de montos
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        description TEXT,
        quantity NUMERIC(15,2),
        unit_price NUMERIC(15,2),
        unit_cost NUMERIC(15,2)
    )
    LOOP
        v_qty := COALESCE(v_item.quantity, 1);
        v_price := COALESCE(v_item.unit_price, 0);
        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'La cantidad de cada item debe ser mayor a cero';
        END IF;
        IF v_price < 0 THEN
            RAISE EXCEPTION 'El precio unitario no puede ser negativo';
        END IF;
        
        v_item_subtotal := ROUND(v_qty * v_price, 2);
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    v_total := GREATEST(0, ROUND(v_subtotal - COALESCE(p_discount, 0), 2));

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
        created_at
    ) VALUES (
        p_organization_id,
        p_customer_id,
        p_customer_name,
        p_sale_number,
        p_sale_date,
        v_subtotal,
        COALESCE(p_discount, 0),
        0,
        v_total,
        COALESCE(p_status, 'confirmed'),
        COALESCE(p_payment_status, 'pending'),
        p_idempotency_key,
        v_created_at
    ) RETURNING id INTO v_sale_id;

    -- 5. Insertar líneas con snapshot histórico
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        description TEXT,
        quantity NUMERIC(15,2),
        unit_price NUMERIC(15,2),
        unit_cost NUMERIC(15,2)
    )
    LOOP
        v_qty := COALESCE(v_item.quantity, 1);
        v_price := COALESCE(v_item.unit_price, 0);
        v_cost := COALESCE(v_item.unit_cost, 0);
        v_item_subtotal := ROUND(v_qty * v_price, 2);

        INSERT INTO sale_items (
            organization_id,
            sale_id,
            product_id,
            description,
            quantity,
            unit_price,
            unit_cost,
            subtotal,
            created_at
        ) VALUES (
            p_organization_id,
            v_sale_id,
            v_item.product_id,
            COALESCE(v_item.description, 'Producto/Servicio'),
            v_qty,
            v_price,
            v_cost,
            v_item_subtotal,
            v_created_at
        );
    END LOOP;

    -- 6. Si la venta es a crédito o pago pendiente, generar automáticamente la cuenta por cobrar
    IF p_payment_status = 'pending' OR p_payment_status = 'partial' THEN
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
            created_at
        ) VALUES (
            p_organization_id,
            v_sale_id,
            p_sale_number,
            p_customer_id,
            p_customer_name,
            v_total,
            v_total,
            p_sale_date + INTERVAL '30 days',
            'pending',
            v_created_at
        );
    END IF;

    -- 7. Registrar Auditoría Server-Side
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        user_name,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_organization_id,
        auth.uid(),
        'Usuario Autenticado',
        'CREAR_VENTA',
        'sale',
        v_sale_id,
        'Venta ' || p_sale_number || ' creada por monto ' || v_total,
        v_created_at
    );

    RETURN jsonb_build_object(
        'id', v_sale_id,
        'organization_id', p_organization_id,
        'sale_number', p_sale_number,
        'subtotal', v_subtotal,
        'total', v_total,
        'created_at', v_created_at
    );
END;
$$;
