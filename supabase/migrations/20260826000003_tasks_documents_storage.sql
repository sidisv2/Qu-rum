-- Migration: 20260826000003_tasks_documents_storage.sql
-- Subfase 4D.5: Tareas, Documentos, Auditoria y Supabase Object Storage Multi-Tenant

-- 1. Crear Bucket Privado para Documentos en Supabase Storage (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    FALSE,
    10485760, -- 10MB limite
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760;

-- 2. Politicas de Seguridad RLS en storage.objects para el Bucket "documents"
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Lectura/Descarga: Usuario solo puede descargar archivos si pertenece a la organizacion indicada en el primer segmento del path
DROP POLICY IF EXISTS "tenant_storage_select" ON storage.objects;
CREATE POLICY "tenant_storage_select" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
);

-- Subida: Usuario solo puede subir si pertenece a la organizacion del path
DROP POLICY IF EXISTS "tenant_storage_insert" ON storage.objects;
CREATE POLICY "tenant_storage_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
);

-- Eliminacion: Usuario solo puede eliminar de su propia organizacion
DROP POLICY IF EXISTS "tenant_storage_delete" ON storage.objects;
CREATE POLICY "tenant_storage_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
);

-- 3. Asegurar columnas compatibles en public.documents
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'category') THEN
        ALTER TABLE public.documents ADD COLUMN category VARCHAR(50) DEFAULT 'other';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'doc_date') THEN
        ALTER TABLE public.documents ADD COLUMN doc_date DATE DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'related_customer_id') THEN
        ALTER TABLE public.documents ADD COLUMN related_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'related_supplier_id') THEN
        ALTER TABLE public.documents ADD COLUMN related_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.documents ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Invariante Append-Only en audit_logs: UPDATE y DELETE totalmente prohibidos
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;

CREATE OR REPLACE RULE audit_logs_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;
