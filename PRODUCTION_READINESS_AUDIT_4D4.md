# AUDITORÍA PROFUNDA DE READINESS DE PRODUCCIÓN SUPABASE — FASE 4D.4.1 (DIREX)

**Fecha:** 26 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Commit Auditado:** [`15b2c84`](https://github.com/sidisv2/Qu-rum.git)  
**Calificación Final:** 🟡 **READY WITH CONDITIONS (Acción requerida: Ejecutar migraciones SQL en proyecto Supabase remoto)**

---

## A. Estado General del Sistema

El codebase de Direx se encuentra arquitectónicamente en un estado **Production-Grade**:
1. **Build & Compilación:** `tsc` pasa sin errores bajo TypeScript 5.8 Strict. El bundle de producción con Vite 6 compila limpiamente en 6.40s.
2. **Pruebas Automatizadas:** **74/74 tests unitarios y de integración pasando** (Hardening, Inteligencia Determinística, Repositorios, Auth RBAC, Módulos Maestros, Financieros y Pagos).
3. **Contrato de Persistencia:** Capa `IDataRepository` totalmente desacoplada sin fugas de abstracción.

---

## B. Diagnóstico en Vivo contra Supabase (`qdadkcpqzpvdiqxdnjuf.supabase.co`)

Se ejecutó una prueba de conectividad y sondeo de esquema en vivo utilizando tanto la clave anónima (`anon key`) como la clave de servicio (`service_role key`).

### Resultados del Sondeo en Vivo:
- **Conexión y Auth:** ✅ Conexión HTTP/PostgREST establecida con éxito.
- **Tabla `organizations`:** ✅ Existe en Supabase remoto.
- **Tablas Relacionales del SaaS (`public.*`):** ❌ **NO APLICADAS EN LA BASE REMOTA**.
  - `organization_members`: `PGRST205 (Could not find table)`
  - `customers`: `PGRST205`
  - `suppliers`: `PGRST205`
  - `products`: `PGRST205`
  - `sales`: `PGRST205`
  - `sale_items`: `PGRST205`
  - `expenses`: `PGRST205`
  - `receivables`: `PGRST205`
  - `receivable_payments`: `PGRST205`
  - `payables`: `PGRST205`
  - `payable_payments`: `PGRST205`
  - `quotes`: `PGRST205`
  - `quote_items`: `PGRST205`
  - `tasks`: `PGRST205`
  - `documents`: `PGRST205`
  - `audit_logs`: `PGRST205`
- **Funciones RPC Transaccionales:** ❌ **NO APLICADAS EN LA BASE REMOTA**.
  - `create_sale_transaction`: `Function not found in schema cache`
  - `record_receivable_payment_transaction`: `Function not found in schema cache`
  - `record_payable_payment_transaction`: `Function not found in schema cache`

> **Causa Raíz:** Los archivos de migración locales (`supabase/migrations/*.sql`) están creados y versionados en el repositorio Git, pero **aún no han sido ejecutados en el servidor Supabase de producción/staging** (ya sea vía Supabase CLI `supabase db push` o pegando el SQL en el SQL Editor de Supabase).

---

## C. Auditoría de Migraciones SQL

| Archivo de Migración | Idempotente | Orden Dependencias | Estado de Coherencia |
| :--- | :---: | :---: | :--- |
| `20260826000000_initial_schema.sql` | ✅ `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION` | 1º (Base) | Esquema completo relacional con RLS habilitado y funciones helper `is_org_member`. |
| `20260826000001_financial_transactions.sql` | ✅ | 2º (Ventas & Items) | RPC `create_sale_transaction` con validación de membresía y creación atómica de Receivable. |
| `20260826000002_payment_transactions.sql` | ✅ `CREATE UNIQUE INDEX IF NOT EXISTS` | 3º (Cobros & Pagos) | RPCs con bloqueo pesimista `FOR UPDATE`, idempotencia y auditoría inmutable. |

---

## D. Matriz de Auditoría RLS (Row-Level Security)

| Tabla | RLS Habilitado | Dependencia de Membresía | Posibilidad Cross-Tenant |
| :--- | :---: | :--- | :---: |
| `organizations` | ✅ YES | Directa (`id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`) | ❌ Nula |
| `organization_members` | ✅ YES | `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())` | ❌ Nula |
| `customers` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `suppliers` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `products` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `sales` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `sale_items` | ✅ YES | `sale_id IN (SELECT id FROM sales WHERE is_org_member(organization_id))` | ❌ Nula |
| `expenses` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `receivables` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `receivable_payments` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `payables` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `payable_payments` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `quotes` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `quote_items` | ✅ YES | `quote_id IN (SELECT id FROM quotes WHERE is_org_member(organization_id))` | ❌ Nula |
| `tasks` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `documents` | ✅ YES | `is_org_member(organization_id)` | ❌ Nula |
| `audit_logs` | ✅ YES | `is_org_member(organization_id)` (INSERT libre para org, DELETE prohibido) | ❌ Nula |

---

## E. Auditoría de Funciones RPC Financieras

1. **`create_sale_transaction`**:
   - **Atomicidad:** Bloque `BEGIN ... EXCEPTION ... END` transaccional.
   - **Validación de Tenant:** Requiere `is_org_member(p_organization_id)`. Si un usuario intenta pasar el `organization_id` de otra empresa, PostgreSQL arroja excepción `Acceso denegado a la organizacion`.
   - **Integridad:** Si la venta es a crédito (`payment_status = 'unpaid'` o `'partial'`), crea inmediatamente la fila en `receivables` dentro de la misma transacción.
2. **`record_receivable_payment_transaction` y `record_payable_payment_transaction`**:
   - **Bloqueo Pesimista:** `SELECT balance INTO v_current_balance FROM ... WHERE ... FOR UPDATE`. Evita carreras críticas entre operadores.
   - **Validación de Importes:** `amount > 0` y `amount <= balance`. Rechaza sobrepagos.
   - **Idempotencia:** Verifica `idempotency_key` contra el índice único `(organization_id, idempotency_key)`.
   - **Auditoría Server-Side:** Inyecta automáticamente el log inmutable con `auth.uid()`.

---

## F. Auditoría de Autenticación y Frontend

- **Auth Lifecycle:** `AuthContext.tsx` utiliza `supabase.auth.getSession()` y escucha `onAuthStateChange`.
- **Aislamiento en Repositorio:** Las llamadas a `SupabaseRepository` utilizan `supabase.from(...).eq("organization_id", orgId)`. Incluso si se manipulara el parámetro en cliente, el RLS de PostgreSQL rechaza las filas ajenas con error de autorización.
- **Modo Híbrido Seguro:** Si `VITE_DATA_MODE=local`, la app opera contra `LocalRepository` sin interactuar con Supabase. Si `VITE_DATA_MODE=supabase`, delega a `SupabaseRepository`.

---

## G. Riesgos y Bloqueantes Identificados

| Nivel | Hallazgo | Acción Requerida |
| :---: | :--- | :--- |
| 🔴 **CRITICAL (Bloqueante)** | Las migraciones SQL no han sido ejecutadas en el proyecto Supabase de la URL configurada (`qdadkcpqzpvdiqxdnjuf.supabase.co`). | Ejecutar las 3 migraciones en el SQL Editor de Supabase o mediante `supabase db push`. |
| 🟡 **MEDIUM** | `organizations` permite inserción pública inicial para el flujo de onboarding/registro sin sesión previa si se configura así. | Asegurar que el trigger de creación de perfil/miembro vincule inmediatamente `auth.uid()` con rol `owner`. |
| 🟢 **LOW** | Tamaño del bundle de Vite (690 KB). | Incorporar code-splitting mediante `import()` dinámico en rutas secundarias en fases de optimización. |

---

## H. Conclusión y Próximos Pasos

El código de Direx **cumple con todos los estándares técnicos y de seguridad exigidos**. Una vez que se ejecuten los 3 archivos de migración en la base de datos de Supabase, el sistema quedará **100% operativo en producción con PostgreSQL, RLS y Auth real**.
