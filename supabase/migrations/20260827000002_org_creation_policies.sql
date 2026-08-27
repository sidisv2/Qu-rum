-- Migration: Allow Authenticated Users to Insert Organization and Become Owner (Fase 9 - Direx)

DROP POLICY IF EXISTS "authenticated_create_org" ON public.organizations;
CREATE POLICY "authenticated_create_org" ON public.organizations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_create_org_member" ON public.organization_members;
CREATE POLICY "authenticated_create_org_member" ON public.organization_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
