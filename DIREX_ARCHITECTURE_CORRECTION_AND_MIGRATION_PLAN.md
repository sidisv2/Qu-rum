# AUDITORÍA DE ARQUITECTURA DEFICITIVA Y PLAN DE CONSOLIDACIÓN SEGURA

**Proyecto:** Direx / Quórum (`https://direx.online`)  
**Fecha:** 28 de Agosto de 2026  
**Estado:** 🛑 **DISEÑO TÉCNICO EN REVISIÓN — NO EJECUTAR DDL NI COMMIT SIN APROBACIÓN**

---

## 1. Semántica y Modelo Canónico de `organization_ai_usage`

### 1.1 Reglas de Negocio y Estados de Suscripción

| Estado de Suscripción | Contador Utilizado | Límite Aplicable | Comportamiento de Renovación / Reset |
| :--- | :--- | :---: | :--- |
| **`trialing` (o sin fila de suscripción)** | `trial_queries_used` | **10 consultas totales** | Restablecible a `0` exclusivamente por `owner`/`admin` vía `reset_trial_ai_usage()`. |
| **`active`** | `monthly_queries_used` | **Starter: 75 / Founder: 200 / Pro: 500** | Se reinicia a `0` automáticamente al avanzar el ciclo mensual (`CURRENT_DATE >= period_end_date`). |
| **`past_due`** | - | **0 consultas (Bloqueo)** | Rechazo explícito con código `SUBSCRIPTION_PAST_DUE`. |
| **`canceled`** | - | **0 consultas (Bloqueo)** | Rechazo explícito con código `SUBSCRIPTION_CANCELED`. |
| **Upgrade / Cambio de Plan** | `monthly_queries_used` | Se amplía el límite del nuevo plan | Se conserva el `monthly_queries_used` del ciclo actual hasta la fecha de renovación. |

### 1.2 DDL de `public.organization_ai_usage` y RLS

```sql
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

-- Política de lectura para miembros del tenant
DROP POLICY IF EXISTS "ai_usage_org_read" ON public.organization_ai_usage;
CREATE POLICY "ai_usage_org_read" ON public.organization_ai_usage
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));
```

### 1.3 Función Canónica `get_ai_usage(p_organization_id UUID)`

```sql
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

  -- Obtener estado de suscripción
  SELECT status, plan_id INTO v_sub_status, v_sub_plan
  FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  v_sub_status := COALESCE(v_sub_status, 'trialing');
  v_sub_plan := COALESCE(v_sub_plan, 'free');

  -- Obtener o inicializar fila de usage
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

  -- Determinar límite y consumo según el estado
  IF v_sub_status = 'trialing' THEN
    v_limit := 10;
    v_used := v_usage.trial_queries_used;
  ELSIF v_sub_status = 'active' THEN
    IF v_sub_plan = 'starter' THEN v_limit := 75;
    ELSIF v_sub_plan = 'founder' THEN v_limit := 200;
    ELSIF v_sub_plan = 'pro' THEN v_limit := 500;
    ELSE v_limit := 75;
    END IF;

    -- Renovación automática de período mensual si ha vencido
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
    -- past_due, canceled
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
```

---

## 2. Consumo Atómico Anti-Race-Conditions (`consume_ai_query`)

Garantiza en una única instrucción SQL atómica con cláusula `WHERE used < limit` que si dos consultas llegan cuando el uso está en `9/10`, exactamente **una** obtendrá la consulta #10 y la otra recibirá `QUOTA_EXCEEDED` (imposibilitando pasar a `11/10`):

```sql
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

  -- Determinar límite
  IF v_sub_status = 'trialing' THEN
    v_limit := 10;
  ELSIF v_sub_plan = 'starter' THEN v_limit := 75;
  ELSIF v_sub_plan = 'founder' THEN v_limit := 200;
  ELSIF v_sub_plan = 'pro' THEN v_limit := 500;
  ELSE v_limit := 75;
  END IF;

  -- 1. Asegurar que existe la fila
  INSERT INTO public.organization_ai_usage (
    organization_id, trial_queries_used, monthly_queries_used, period_start_date, period_end_date
  ) VALUES (
    p_organization_id, 0, 0, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE
  ) ON CONFLICT (organization_id) DO NOTHING;

  -- 2. Consumo Atómico según Estado
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
    -- Estado active: Comprobar reinicio de período
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
```

---

## 3. Reseteo Seguro (`reset_trial_ai_usage`) con Upsert y Preservación de Auditoría

```sql
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

  -- 1. Upsert en organization_ai_usage (reseteo a 0 sin tocar audit_logs históricos)
  INSERT INTO public.organization_ai_usage (
    organization_id, trial_queries_used, monthly_queries_used, period_start_date, period_end_date, updated_at
  ) VALUES (
    p_organization_id, 0, 0, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE, timezone('utc'::text, now())
  ) ON CONFLICT (organization_id) DO UPDATE
  SET trial_queries_used = 0,
      updated_at = timezone('utc'::text, now());

  -- 2. Evento inmutable de trazabilidad
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
```

---

## 4. Inmutabilidad Real de `public.audit_logs`

El análisis del esquema en Cloud confirmó que la tabla `public.audit_logs` cuenta con la regla PostgreSQL inmutable:
```sql
CREATE OR REPLACE RULE audit_logs_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
```
Para blindar completamente contra eliminaciones directas de usuarios:
```sql
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;
```

---

## 5. Auditoría Exhaustiva de Foreign Keys hacia `customers` y `suppliers`

Se realizó una inspección completa en Supabase Cloud cruzando todas las tablas del sistema:

| Tabla de Producción | Columna FK | Total Filas en Org `41696c80...` | Estado de Vinculación con Duplicados |
| :--- | :--- | :---: | :--- |
| `public.sales` | `customer_id` | **70** | **70 ventas vinculadas a clientes duplicados** (cada venta a uno de los duplicados). |
| `public.receivables` | `customer_id` | **0** | 0 registros vinculados. |
| `public.quotes` | `customer_id` | **0** | 0 registros vinculados. |
| `public.expenses` | `supplier_id` | **0** | 0 proveedores duplicados (tabla limpia). |
| `public.payables` | `supplier_id` | **0** | 0 proveedores duplicados. |

---

## 6. Análisis Atributo por Atributo y Selección del Registro Canónico

Al analizar todos los campos de los 54 registros de clientes duplicados en Cloud:
* **Campos `tax_id`, `email`, `phone`, `address`:** Todos los registros (canónicos y duplicados) tienen strings vacíos `""`.
* **Campo `is_active`:** Todos están en `TRUE`.
* **Total de Ventas vinculadas:**
  * En el grupo `"cliente general"`: 2 registros con 10 ventas cada uno.
  * En los otros 10 grupos: 5 registros con 1 venta cada uno.

### 🟢 Propuesta de Registro Canónico
Dado que ninguno de los registros posee datos de contacto diferenciales ni campos fiscales dispares, **el registro canónico por cada grupo es el creado en primer lugar (`MIN(created_at)`)**:

| Grupo Normalizado | ID Canónico Propuesto (`MIN(created_at)`) | IDs Duplicados a Reasignar | Ventas a Reasignar |
| :--- | :--- | :--- | :---: |
| `cliente general` | `e22dd184-d7e1-4096-96ac-3c5a0932e06f` | `eb2770e1-42d6-41ac-a197-8377e7d80146` | 10 |
| `tech solutions sa` | `1d3779e8-26b4-404f-86b2-874c48b412f6` | `180bd241...`, `fff373fb...`, `1d08b40d...`, `fffa5853...` | 4 |
| `amazon web services` | `165eeb0c-95a2-438f-87c4-40b6121bdb92` | `d9aa32f3...`, `582b0e31...`, `57a3bb13...`, `2dd63561...` | 4 |
| `distribuidora norte srl`| `f8513a53-7384-4962-898c-3c4a768953f8` | `4e9c6b90...`, `0419483a...`, `4b68cb0a...`, `d666cc50...` | 4 |
| `inmobiliaria central` | `101f43ec-c601-4f7e-9c00-c12ee64e9e52` | `f066e2c3...`, `49d1b874...`, `e8f5f053...`, `d4b9c3e6...` | 4 |
| `logística andina` | `5a05a888-60c0-49af-86e0-e5d55d9f0f5c` | `0def2303...`, `56bde652...`, `3916b9a9...`, `d92378c8...` | 4 |
| `telecom argentina` | `14ac0292-a967-4bce-9962-e4fe67bb8ea1` | `e476ddab...`, `b91e954c...`, `0bba1a44...`, `67817323...` | 4 |
| `farmacia san martín` | `503e937a-ca71-4f60-8d16-132041c24418` | `7854b2b3...`, `e2021d17...`, `aafe746d...`, `1ad16bb2...` | 4 |
| `estudio contable pérez`| `08b8b9db-ea5f-45df-a033-1cd7dec8ea68` | `243727a9...`, `4970c0a0...`, `cbae4334...`, `a8b3454a...` | 4 |
| `grupo inversor del sur`| `2b337335-4bdc-4507-90c5-5d40c2c5c4ff` | `7135441b...`, `17a8a8e6...`, `356946d6...`, `17e965bd...` | 4 |
| `librería comercial` | `d495c0ed-dd83-4dd6-9c60-be08194c897d` | `c92d8742...`, `46b53b9e...`, `32e88dea...`, `9c2e7cdb...` | 4 |

### Estrategia de Consolidación (Preservación Absoluta)
1. `UPDATE sales SET customer_id = <canónico> WHERE customer_id IN (<duplicados>)`
2. `UPDATE customers SET deleted_at = timezone('utc'::text, now()) WHERE id IN (<duplicados>)` (Soft-delete: no se destruyen registros ni IDs).
3. `CREATE UNIQUE INDEX idx_customers_org_normalized_name ON public.customers (organization_id, lower(trim(name))) WHERE deleted_at IS NULL;`

---

## 7. Integración de la Edge Function (`director-ia`)

En [`supabase/functions/director-ia/index.ts`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/supabase/functions/director-ia/index.ts), el bloque de validación pasa a invocar la RPC server-side atómica:

```ts
// 4.1 Consumo Atómico de Cuota Server-Side
const { data: quotaResult, error: quotaError } = await supabaseClient.rpc("consume_ai_query", {
  p_organization_id: targetOrgId
});

if (quotaError || !quotaResult?.allowed) {
  const errCode = quotaResult?.error || "QUOTA_EXCEEDED";
  const msg = errCode === "SUBSCRIPTION_PAST_DUE"
    ? "La suscripción de la organización está vencida. Actualizá el medio de pago."
    : "Límite de consultas del Plan alcanzado. Actualizá tu plan en /configuracion/mi-plan.";
  
  return new Response(
    JSON.stringify({ error: { code: errCode, message: msg, details: quotaResult } }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } }
  );
}
```

---

## 8. Matriz de Estado de Verificación

| Componente | Verificación Local | Verificación Cloud | Estado |
| :--- | :---: | :---: | :---: |
| **Parser Localizado y Sanitizador UUID** | 🟢 **LOCAL VERIFIED** | 🟢 **CLOUD VERIFIED** | **PASS** |
| **Constraints PostgreSQL (`amount > 0`)**| 🟢 **LOCAL VERIFIED** | 🟢 **CLOUD VERIFIED** | **PASS** |
| **Aislamiento Multi-Tenant en App** | 🟢 **LOCAL VERIFIED** | 🟢 **LOCAL VERIFIED** | **PASS** |
| **Tabla `organization_ai_usage`** | 🟢 **LOCAL VERIFIED** | ⚪ **NOT VERIFIED (PENDING APPROVAL)** | **DISEÑO LISTO** |
| **RPC `consume_ai_query` (Atómica)** | 🟢 **LOCAL VERIFIED** | ⚪ **NOT VERIFIED (PENDING APPROVAL)** | **DISEÑO LISTO** |
| **RPC `reset_trial_ai_usage` (Inmutable)**| 🟢 **LOCAL VERIFIED** | ⚪ **NOT VERIFIED (PENDING APPROVAL)** | **DISEÑO LISTO** |
| **Plan de Consolidación de Duplicados** | 🟢 **LOCAL VERIFIED** | ⚪ **NOT VERIFIED (PENDING APPROVAL)** | **AUDITADO** |

---

### Estado del Working Tree

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
	modified:   src/components/director-ia/DirectorIAView.tsx
	modified:   src/components/import-csv/ImportCSVView.tsx
	modified:   src/components/subscription/SubscriptionView.tsx
	modified:   src/context/OrgContext.tsx
	modified:   src/lib/repository/localRepository.ts
	modified:   src/lib/repository/supabaseRepository.ts
	modified:   src/lib/repository/types.ts
	modified:   src/lib/subscription/planLimits.ts
	modified:   src/lib/utils/formatters.ts
	modified:   src/test/csvImport.integration.test.ts

Untracked files:
	DIREX_ARCHITECTURE_CORRECTION_AND_MIGRATION_PLAN.md
	SUPABASE_RPC_PRODUCTION_VERIFICATION.md
	supabase/migrations/20260828000000_reset_trial_ai_usage.sql
	supabase/migrations/20260828000001_atomic_find_or_create.sql
```

*(Conforme a las instrucciones, **NO** se ha realizado git commit, git push, ni se ha ejecutado ninguna sentencia DDL en Supabase Cloud. Quedo a la espera de tu aprobación).*
