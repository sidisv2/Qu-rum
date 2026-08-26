# AUDITORÍA DE MIGRACIÓN DE DATOS — FASE 4D.1: CONTRATO DEL REPOSITORIO Y FUENTE DE VERDAD

## 1. Mapa de Dependencias y Estado Actual
- **Modos de Ejecución:**
  - `VITE_DATA_MODE=local`: Utiliza `LocalRepository` (`OrganizationStore` sobre `localStorage`) para demo, desarrollo y tests.
  - `VITE_DATA_MODE=supabase`: Utiliza `SupabaseRepository` conectando con PostgreSQL 16 y RLS activo.
- **Auditoría de Lecturas y Escrituras Directas:**
  - En `src/context/OrgContext.tsx`, las mutaciones históricas operaban sobre arrays en memoria guardando en `OrganizationStore`.
  - En `src/lib/repository/supabaseRepository.ts`, se implementaron las consultas CRUD directas hacia Supabase, pero faltaban métodos de actualización granular (`updateExpense`, `updateTask`, `updateSalePayment`, etc.) y paginación estructurada.
  - Ningún componente React de vista invoca a `localStorage` directamente; todos consumen los métodos expuestos por `useOrg()`.

---

## 2. Comparativa del Contrato `IDataRepository` vs Esquema Relacional (17 Tablas)

| Entidad | Tabla PostgreSQL | Método en `IDataRepository` | Soporte `LocalRepository` | Soporte `SupabaseRepository` |
|---|---|---|---|---|
| **Organizations** | `organizations` | `getOrganizations`, `createOrganization`, `updateOrganization` | ✅ Completo | ✅ Completo |
| **Members** | `organization_members` | `getMembers`, `addMember`, `removeMember` | ✅ Completo | ✅ Completo |
| **Customers** | `customers` | `getCustomers`, `createCustomer`, `updateCustomer`, `deleteCustomer` | ✅ Completo | ✅ Completo |
| **Suppliers** | `suppliers` | `getSuppliers`, `createSupplier`, `updateSupplier`, `deleteSupplier` | ✅ Completo | ✅ Completo |
| **Products** | `products` | `getProducts`, `createProduct`, `updateProduct`, `deleteProduct` | ✅ Completo | ✅ Completo |
| **Sales & Items** | `sales`, `sale_items` | `getSales`, `createSale`, `updateSaleStatus` | ✅ Completo | ✅ Completo |
| **Expenses** | `expenses` | `getExpenses`, `createExpense`, `deleteExpense` | ✅ Completo | ✅ Completo |
| **Receivables** | `receivables`, `payments` | `getReceivables`, `recordPaymentReceivable` | ✅ Completo | ✅ Completo |
| **Payables** | `payables`, `payments` | `getPayables`, `recordPaymentPayable` | ✅ Completo | ✅ Completo |
| **Quotes & Items** | `quotes`, `quote_items` | `getQuotes`, `createQuote`, `updateQuoteStatus` | ✅ Completo | ✅ Completo |
| **Tasks** | `tasks` | `getTasks`, `createTask`, `toggleTaskStatus`, `deleteTask` | ✅ Completo | ✅ Completo |
| **Documents** | `documents` | `getDocuments`, `uploadDocument`, `deleteDocument` | ✅ Completo | ✅ Completo |
| **Audit Logs** | `audit_logs` | `getAuditLogs`, `addAuditLog` | ✅ Completo | ✅ Completo |

---

## 3. Discrepancias Tipadas Resueltas
- **Precios y Montos:** En `SupabaseRepository`, los valores `NUMERIC(15,2)` retornados como strings/números por PostgreSQL son convertidos explícitamente con `Number(val) || 0` para evitar inconsistencias de tipos en TypeScript.
- **Snapshots de Ventas:** `createSale` inserta transaccionalmente la cabecera en `sales` y el detalle inmutable en `sale_items`.
- **Soft Delete:** `customers`, `suppliers` y `documents` marcan `deleted_at = now()` preservando la integridad referencial de comprobantes contables históricos.

---

## 4. Plan de Ejecución por Subfases (4D.1 a 4D.10)
- **4D.1 (Completada):** Auditoría y formalización del contrato `IDataRepository` y `REPOSITORY_CONTRACT.md`.
- **4D.2:** Módulos maestros de Clientes, Proveedores y Productos con paginación.
- **4D.3:** Ventas y detalle de líneas (`sales` + `sale_items`).
- **4D.4:** Gastos, Cuentas a Pagar y Cuentas a Cobrar con historial de amortizaciones.
- **4D.5:** Presupuestos, Tareas y Documentos.
- **4D.6:** Auditoría inmutable de acciones.
- **4D.7:** Utilidad explícita de migración de datos locales a la nube (`localToSupabase.ts`).
- **4D.8:** Conexión del `InsightEngine` y `DirectorAIService` con los datos del repositorio.
- **4D.9:** Tests automatizados de integración y seguridad multi-tenant.
- **4D.10:** Hardening final de producción y verificación de build.
