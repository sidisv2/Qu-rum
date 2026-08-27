-- Migration: Subscription Plans and Mercado Pago Preapproval Subscriptions (Fase 9 - Direx)

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_ars NUMERIC(12, 2) NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed de los 3 planes de negocio
INSERT INTO public.subscription_plans (id, name, price_ars, max_users, features)
VALUES 
  ('founder', 'Plan Fundador (Exclusivo 10 Cupos)', 9900.00, 5, '["Director IA ilimitado", "Gestión de Cobros Inteligente", "Hasta 5 usuarios", "Precio congelado 12 meses", "Soporte prioritario 1 a 1"]'::jsonb),
  ('starter', 'Plan Starter', 19900.00, 2, '["Director IA estándar", "Ventas, Gastos y Cobranzas", "Hasta 2 usuarios", "Importador CSV"]'::jsonb),
  ('pro', 'Plan Pro', 44900.00, 10, '["Director IA Avanzado", "Multi-usuario (hasta 10)", "Almacenamiento extendido de comprobantes", "Soporte prioritario", "Todas las funcionalidades"]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, price_ars = EXCLUDED.price_ars, features = EXCLUDED.features;

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES public.subscription_plans(id),
  status VARCHAR(30) NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')) DEFAULT 'trialing',
  is_founder_price BOOLEAN NOT NULL DEFAULT false,
  founder_price_expires_at TIMESTAMPTZ,
  mercadopago_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

CREATE POLICY "Members can view their organization subscription"
  ON public.organization_subscriptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage their organization subscription"
  ON public.organization_subscriptions
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Función para contar cupos activos de Fundador (máximo 10)
CREATE OR REPLACE FUNCTION public.get_founder_slots_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.organization_subscriptions 
    WHERE is_founder_price = true AND status IN ('active', 'trialing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
