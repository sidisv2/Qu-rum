-- Migration: 20260827000003_support_tickets.sql
-- Description: Support tickets system with RLS tenant isolation

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('bug', 'billing', 'feature_request', 'general_support')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON public.support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies RLS
DROP POLICY IF EXISTS "org_members_read_tickets" ON public.support_tickets;
CREATE POLICY "org_members_read_tickets" ON public.support_tickets
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "org_members_create_tickets" ON public.support_tickets;
CREATE POLICY "org_members_create_tickets" ON public.support_tickets
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );
