-- Migration: 20260826000002_payment_transactions.sql
-- Subfase 4D.4: Transacciones de Registro de Cobros y Pagos con bloqueo pesimista (FOR UPDATE)

-- 1. Soporte de Idempotencia en Pagos
ALTER TABLE public.receivable_payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_receivable_payments_idempotency ON public.receivable_payments(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.payable_payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payable_payments_idempotency ON public.payable_payments(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 2. Función Transaccional de Cobros (Receivables)
CREATE OR REPLACE FUNCTION record_receivable_payment_transaction(
    p_organization_id UUID,
    p_receivable_id UUID,
    p_amount NUMERIC(15,2),
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_payment_method TEXT DEFAULT 'Transferencia',
    p_reference TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rec RECORD;
    v_payment_id UUID;
    v_clean_amount NUMERIC(15,2);
    v_new_balance NUMERIC(15,2);
    v_new_status TEXT;
    v_existing_id UUID;
BEGIN
    -- Validar autorización RLS
    IF NOT is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'Acceso denegado a la organización especificada';
    END IF;

    -- Validar Idempotencia
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key != '' THEN
        SELECT id INTO v_existing_id FROM receivable_payments
        WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object('id', v_existing_id, 'status', 'idempotent_replay');
        END IF;
    END IF;

    v_clean_amount := ROUND(p_amount, 2);
    IF v_clean_amount <= 0 THEN
        RAISE EXCEPTION 'El monto del pago debe ser mayor a cero';
    END IF;

    -- Bloqueo pesimista del comprobante
    SELECT * INTO v_rec FROM receivables
    WHERE id = p_receivable_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF v_rec.id IS NULL THEN
        RAISE EXCEPTION 'Cuenta por cobrar no encontrada';
    END IF;

    IF v_rec.status = 'paid' OR v_rec.balance <= 0 THEN
        RAISE EXCEPTION 'Esta cuenta ya se encuentra saldada en su totalidad';
    END IF;

    IF v_clean_amount > v_rec.balance THEN
        RAISE EXCEPTION 'El monto a pagar (%) supera el saldo pendiente (%)', v_clean_amount, v_rec.balance;
    END IF;

    v_new_balance := ROUND(v_rec.balance - v_clean_amount, 2);
    IF v_new_balance = 0 THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partial';
    END IF;

    -- Insertar pago inmutable
    INSERT INTO receivable_payments (
        organization_id,
        receivable_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        created_by,
        idempotency_key
    ) VALUES (
        p_organization_id,
        p_receivable_id,
        v_clean_amount,
        COALESCE(p_payment_date, CURRENT_DATE),
        p_payment_method,
        p_reference,
        p_notes,
        auth.uid(),
        p_idempotency_key
    ) RETURNING id INTO v_payment_id;

    -- Actualizar balance y estado en cuenta por cobrar
    UPDATE receivables
    SET balance = v_new_balance,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_receivable_id;

    -- Registrar en Auditoría
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        user_name,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_organization_id,
        auth.uid(),
        'Usuario Autenticado',
        'REGISTRAR_COBRO',
        'receivable_payment',
        v_payment_id,
        'Cobro de ' || v_clean_amount || ' aplicado a ' || v_rec.sale_number || '. Saldo restante: ' || v_new_balance
    );

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'receivable_id', p_receivable_id,
        'amount_paid', v_clean_amount,
        'new_balance', v_new_balance,
        'new_status', v_new_status
    );
END;
$$;

-- 3. Función Transaccional de Pagos a Proveedores (Payables)
CREATE OR REPLACE FUNCTION record_payable_payment_transaction(
    p_organization_id UUID,
    p_payable_id UUID,
    p_amount NUMERIC(15,2),
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_payment_method TEXT DEFAULT 'Transferencia',
    p_reference TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pay RECORD;
    v_payment_id UUID;
    v_clean_amount NUMERIC(15,2);
    v_new_balance NUMERIC(15,2);
    v_new_status TEXT;
    v_existing_id UUID;
BEGIN
    IF NOT is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'Acceso denegado a la organización especificada';
    END IF;

    IF p_idempotency_key IS NOT NULL AND p_idempotency_key != '' THEN
        SELECT id INTO v_existing_id FROM payable_payments
        WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object('id', v_existing_id, 'status', 'idempotent_replay');
        END IF;
    END IF;

    v_clean_amount := ROUND(p_amount, 2);
    IF v_clean_amount <= 0 THEN
        RAISE EXCEPTION 'El monto del pago debe ser mayor a cero';
    END IF;

    SELECT * INTO v_pay FROM payables
    WHERE id = p_payable_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF v_pay.id IS NULL THEN
        RAISE EXCEPTION 'Cuenta por pagar no encontrada';
    END IF;

    IF v_pay.status = 'paid' OR v_pay.balance <= 0 THEN
        RAISE EXCEPTION 'Esta cuenta por pagar ya se encuentra saldada en su totalidad';
    END IF;

    IF v_clean_amount > v_pay.balance THEN
        RAISE EXCEPTION 'El monto a pagar (%) supera el saldo pendiente (%)', v_clean_amount, v_pay.balance;
    END IF;

    v_new_balance := ROUND(v_pay.balance - v_clean_amount, 2);
    IF v_new_balance = 0 THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partial';
    END IF;

    INSERT INTO payable_payments (
        organization_id,
        payable_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        created_by,
        idempotency_key
    ) VALUES (
        p_organization_id,
        p_payable_id,
        v_clean_amount,
        COALESCE(p_payment_date, CURRENT_DATE),
        p_payment_method,
        p_reference,
        p_notes,
        auth.uid(),
        p_idempotency_key
    ) RETURNING id INTO v_payment_id;

    UPDATE payables
    SET balance = v_new_balance,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_payable_id;

    INSERT INTO audit_logs (
        organization_id,
        user_id,
        user_name,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_organization_id,
        auth.uid(),
        'Usuario Autenticado',
        'REGISTRAR_PAGO_PROVEEDOR',
        'payable_payment',
        v_payment_id,
        'Pago de ' || v_clean_amount || ' aplicado a ' || v_pay.supplier_name || '. Saldo restante: ' || v_new_balance
    );

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'payable_id', p_payable_id,
        'amount_paid', v_clean_amount,
        'new_balance', v_new_balance,
        'new_status', v_new_status
    );
END;
$$;
