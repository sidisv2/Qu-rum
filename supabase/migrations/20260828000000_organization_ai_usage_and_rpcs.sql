-- =========================================================================
-- MIGRACIÓN 1: Tabla organization_ai_usage y RPCs canónicas de consumo y reset
-- =========================================================================

-- 1. Tabla de consumo de cuota por organización
CREATE TABLE IF NOT EXISTS public.organization_ai_usage (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  trial_queries_used INTEGER NOT NULL DEFAULT 0,
  monthly_queries_used INTEGER NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month')::DATE,
  last_query_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.organization_ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_org_read" ON public.organization_ai_usage;
CREATE POLICY "ai_usage_org_read" ON public.organization_ai_usage
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

-- 2. Función get_ai_usage
CREATE OR REPLACE FUNCTION public.get_ai_usage(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller_user_id UUID;
  v_caller_role VARCHAR(50);
  v_sub_status VARCHAR(50);
  v_sub_plan VARCHAR(50);
  v_limit INTEGER := 10;
  v_used INTEGER := 0;
  v_usage public.organization_ai_usage%ROWTYPE;
BEGIN
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id AND user_id = v_caller_user_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Acceso no autorizado a la organización %', p_organization_id USING ERRCODE = '42501';
  END IF;

  SELECT status, plan_id INTO v_sub_status, v_sub_plan
  FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  v_sub_status := COALESCE(v_sub_status, 'trialing');
  v_sub_plan := COALESCE(v_sub_plan, 'free');

  SELECT * INTO v_usage
  FROM public.organization_ai_usage
  WHERE organization_id = p_organization_id;

  IF v_usage.organization_id IS NULL THEN
    INSERT INTO public.organization_ai_usage (
      organization_id, trial_queries_used, monthly_queries_used, period_start_date, period_end_date
    ) VALUES (
      p_organization_id, 0, 0, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE
    ) RETURNING * INTO v_usage;
  END IF;

  IF v_sub_status = 'trialing' THEN
    v_limit := 10;
    v_used := v_usage.trial_queries_used;
  ELSIF v_sub_status = 'active' THEN
    IF v_sub_plan = 'starter' THEN v_limit := 75;
    ELSIF v_sub_plan = 'founder' THEN v_limit := 200;
    ELSIF v_sub_plan = 'pro' THEN v_limit := 500;
    ELSE v_limit := 75;
    END IF;

    IF CURRENT_DATE >= v_usage.period_end_date THEN
      UPDATE public.organization_ai_usage
      SET monthly_queries_used = 0,
          period_start_date = CURRENT_DATE,
          period_end_date = (CURRENT_DATE + INTERVAL '1 month')::DATE,
          updated_at = timezone('utc'::text, now())
      WHERE organization_id = p_organization_id
      RETURNING * INTO v_usage;
    END IF;

    v_used := v_usage.monthly_queries_used;
  ELSE
    v_limit := 0;
    v_used := v_usage.monthly_queries_used;
  END IF;

  RETURN jsonb_build_object(
    'organization_id', p_organization_id,
    'status', v_sub_status,
    'plan', v_sub_plan,
    'used', v_used,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_used),
    'period_start', v_usage.period_start_date,
    'period_end', v_usage.period_end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_ai_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_usage(UUID) TO authenticated;

-- 3. Función consume_ai_query (Atómica)
CREATE OR REPLACE FUNCTION public.consume_ai_query(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller_user_id UUID;
  v_caller_role VARCHAR(50);
  v_sub_status VARCHAR(50);
  v_sub_plan VARCHAR(50);
  v_limit INTEGER := 10;
  v_updated_row public.organization_ai_usage%ROWTYPE;
BEGIN
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id AND user_id = v_caller_user_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Acceso no autorizado a la organización %', p_organization_id USING ERRCODE = '42501';
  END IF;

  SELECT status, plan_id INTO v_sub_status, v_sub_plan
  FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  v_sub_status := COALESCE(v_sub_status, 'trialing');
  v_sub_plan := COALESCE(v_sub_plan, 'free');

  IF v_sub_status IN ('past_due', 'canceled') THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'SUBSCRIPTION_' || upper(v_sub_status),
      'message', 'La suscripción de la organización está ' || v_sub_status
    );
  END IF;

  IF v_sub_status = 'trialing' THEN
    v_limit := 10;
  ELSIF v_sub_plan = 'starter' THEN v_limit := 75;
  ELSIF v_sub_plan = 'founder' THEN v_limit := 200;
  ELSIF v_sub_plan = 'pro' THEN v_limit := 500;
  ELSE v_limit := 75;
  END IF;

  INSERT INTO public.organization_ai_usage (
    organization_id, trial_queries_used, monthly_queries_used, period_start_date, period_end_date
  ) VALUES (
    p_organization_id, 0, 0, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE
  ) ON CONFLICT (organization_id) DO NOTHING;

  IF v_sub_status = 'trialing' THEN
    UPDATE public.organization_ai_usage
    SET trial_queries_used = trial_queries_used + 1,
        last_query_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE organization_id = p_organization_id AND trial_queries_used < v_limit
    RETURNING * INTO v_updated_row;

    IF v_updated_row.organization_id IS NULL THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'error', 'QUOTA_EXCEEDED',
        'used', v_limit,
        'limit', v_limit,
        'status', v_sub_status
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', true,
      'used', v_updated_row.trial_queries_used,
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_updated_row.trial_queries_used),
      'status', v_sub_status
    );

  ELSE
    UPDATE public.organization_ai_usage
    SET monthly_queries_used = 0,
        period_start_date = CURRENT_DATE,
        period_end_date = (CURRENT_DATE + INTERVAL '1 month')::DATE
    WHERE organization_id = p_organization_id AND CURRENT_DATE >= period_end_date;

    UPDATE public.organization_ai_usage
    SET monthly_queries_used = monthly_queries_used + 1,
        last_query_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE organization_id = p_organization_id AND monthly_queries_used < v_limit
    RETURNING * INTO v_updated_row;

    IF v_updated_row.organization_id IS NULL THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'error', 'QUOTA_EXCEEDED',
        'used', v_limit,
        'limit', v_limit,
        'status', v_sub_status
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', true,
      'used', v_updated_row.monthly_queries_used,
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_updated_row.monthly_queries_used),
      'status', v_sub_status
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.consume_ai_query(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_query(UUID) TO authenticated;

-- 4. Función reset_trial_ai_usage (Inmutable)
CREATE OR REPLACE FUNCTION public.reset_trial_ai_usage(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller_user_id UUID;
  v_caller_role VARCHAR(50);
  v_caller_email TEXT;
  v_sub_status VARCHAR(50);
BEGIN
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id AND user_id = v_caller_user_id;

  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'No autorizado. Se requiere rol owner o admin en la organización.' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_sub_status
  FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  IF v_sub_status IS NOT NULL AND v_sub_status <> 'trialing' THEN
    RAISE EXCEPTION 'Operación denegada. Solo se pueden restablecer consultas de prueba en organizaciones en estado trialing (estado actual: %)', v_sub_status
      USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_caller_email
  FROM auth.users
  WHERE id = v_caller_user_id;

  INSERT INTO public.organization_ai_usage (
    organization_id, trial_queries_used, monthly_queries_used, period_start_date, period_end_date, updated_at
  ) VALUES (
    p_organization_id, 0, 0, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE, timezone('utc'::text, now())
  ) ON CONFLICT (organization_id) DO UPDATE
  SET trial_queries_used = 0,
      updated_at = timezone('utc'::text, now());

  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    p_organization_id,
    v_caller_user_id,
    COALESCE(v_caller_email, 'Admin'),
    'RESET_TRIAL_AI_USAGE',
    'director_ai',
    p_organization_id,
    'Consultas de prueba restablecidas a 0 por ' || COALESCE(v_caller_role, 'admin')
  );

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'trial_queries_used', 0,
    'reset_by', v_caller_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.reset_trial_ai_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_trial_ai_usage(UUID) TO authenticated;
