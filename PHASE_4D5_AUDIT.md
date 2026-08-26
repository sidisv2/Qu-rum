# AUDITORÍA DE ARQUITECTURA Y GAPS — FASE 4D.5 (DIREX)
## Tasks + Documents + Audit Logs + Supabase Storage

**Fecha:** 26 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Commit Base:** [`5a5ee62`](https://github.com/sidisv2/Qu-rum.git)  
**Instancia Supabase:** `ychqcwbpzmjpsbowzvpk.supabase.co`  
**Data Mode:** `VITE_DATA_MODE=supabase`  

---

## 1. Estado Actual y Funcionalidades Existentes

1. **Persistencia & Repositorios:**
   - `IDataRepository` cuenta con firmas básicas de `getTasks`, `createTask`, `toggleTaskStatus`, `deleteTask`, `getDocuments`, `uploadDocument`, `deleteDocument`, `getAuditLogs`, `addAuditLog`.
   - `LocalRepository` implementa estas funciones en memoria/localStorage.
   - `SupabaseRepository` actualmente implementa llamadas CRUD básicas sin paginación ni storage real.
2. **Esquema Relacional PostgreSQL:**
   - Tablas `tasks`, `documents`, `audit_logs` ya fueron creadas en `20260826000000_initial_schema.sql` con RLS habilitado y policies de aislamiento por `is_org_member(organization_id)`.
3. **Frontend UI:**
   - `TasksView.tsx`, `DocumentsView.tsx`, `AuditView.tsx` existen con diseño estético de alta calidad según `DESIGN_SYSTEM.md`, pero operan sobre arrays en memoria sin carga de archivos reales ni paginación server-side.

---

## 2. Gaps Identificados para Producción

1. **Tasks (Tareas):**
   - Falta soporte de paginación (`PaginatedResult<Task>`), filtros server-side por estado (`pending`, `in_progress`, `completed`, `cancelled`) y búsqueda por título.
   - Firma en `IDataRepository` debe ampliarse a: `getTasks(orgId, params)`, `getTaskById(orgId, id)`, `createTask(orgId, task)`, `updateTask(orgId, id, data)`, `deleteTask(orgId, id)`.
2. **Documents & Object Storage:**
   - La tabla `documents` actual solo guarda metadatos simples. Falta desacoplar el almacenamiento de archivos binarios hacia Supabase Storage en un bucket privado (`documents`).
   - Falta la capa `IStorageRepository` (`src/lib/storage/`) con:
     - `SupabaseStorageRepository`: sube al bucket privado bajo el path `{organization_id}/{document_id}/{filename}` y genera Signed URLs temporales para descarga/visualización segura.
     - `LocalStorageRepository`: fallback seguro para modo local/demo (ObjectURL o memoria sin persistencia remota).
3. **Audit Logs (Append-Only Inmutable):**
   - Falta paginación y filtros server-side (`getAuditLogs(orgId, params)`).
   - Bloqueo estricto de mutaciones: `UPDATE` y `DELETE` prohibidos por RLS.
4. **Políticas de Storage en PostgreSQL:**
   - Se debe crear la migración `20260826000003_tasks_documents_storage.sql` con la creación del bucket privado `documents` en `storage.buckets` y las policies de RLS en `storage.objects` validando que `(storage.foldername(name))[1] = organization_id::text` y `is_org_member(organization_id)`.

---

## 3. Plan de Implementación Seguro

1. **Migración SQL (`supabase/migrations/20260826000003_tasks_documents_storage.sql`):**
   - Creación del bucket privado `documents` en Supabase Storage si no existe.
   - Policies de RLS en `storage.objects` para aislamiento tenant-safe.
   - Triggers y constraints de validación.
2. **Capa de Almacenamiento (`src/lib/storage/`):**
   - `types.ts`: Contrato `IStorageRepository` (`upload`, `download`, `getSignedUrl`, `delete`).
   - `supabaseStorage.ts`: Implementación sobre `@supabase/supabase-js`.
   - `localStorage.ts`: Implementación fallback mock para demo/local.
   - `index.ts`: Fábrica `getStorageRepository()`.
3. **Contrato de Repositorio (`src/lib/repository/types.ts`):**
   - Actualizar firmas con `PaginatedResult` y soporte completo para Tasks, Documents y AuditLogs.
4. **Implementación de Repositorios:**
   - `src/lib/repository/localRepository.ts`
   - `src/lib/repository/supabaseRepository.ts`
5. **Contexto y Vistas UI:**
   - `src/context/OrgContext.tsx`
   - `src/components/tasks/TasksView.tsx` (filtros, estados, asignación).
   - `src/components/documents/DocumentsView.tsx` (upload real con File picker, signed URLs de descarga).
   - `src/components/audit/AuditView.tsx` (paginación, filtros de auditoría).
6. **Suite de Pruebas Automatizadas:**
   - `src/lib/tasks-documents/__tests__/tasksDocumentsWorkflow.test.ts`
   - Registrar en `src/test/run-all-tests.ts`.
7. **Verificación Estricta & Live Testing:**
   - `npx tsc --noEmit`
   - `npm run test` (100% PASS)
   - `npm run build` (exit code 0)
   - Prueba en vivo contra Supabase remoto.
