# INVENTARIO COMPLETO DEL SISTEMA — FASE 4G (DIREX)
## Pre-Launch Product Acceptance Audit

**Fecha:** 26 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Project ID Supabase:** `ychqcwbpzmjpsbowzvpk`  
**URL Producción:** `https://ychqcwbpzmjpsbowzvpk.supabase.co`  
**Deploy Frontend:** Vercel (`https://quorum-psi-three.vercel.app` / `https://direx.app`)

---

## 1. Arquitectura y Stack Tecnológico
- **Frontend:** React 19 + TypeScript 5.8 (Strict Mode) + Vite 6 + Tailwind/Vanilla CSS.
- **Backend / Database:** PostgreSQL 15+ (Supabase) con Row Level Security (RLS) en 17 tablas relacionales.
- **Autenticación:** Supabase Auth (JWT) + RBAC (`owner`, `admin`, `member`) en `organization_members`.
- **Almacenamiento:** Supabase Storage (Bucket privado `documents` con Signed URLs temporales).
- **IA / Inferencia Server-Side:** Supabase Edge Function (`/functions/v1/director-ia`) con Google Gemini 2.5 Flash API + Contexto financiero determinístico inmutable.
- **Persistencia Dual:** Abstracción `IDataRepository` (`SupabaseRepository` para producción / `LocalRepository` para demo offline).

---

## 2. Inventario de Tablas y Esquema Relacional (17 Tablas)
1. `organizations`: Entidad tenant raíz.
2. `organization_members`: Vínculo usuario-organización con RBAC.
3. `customers`: Clientes con balances de deuda calculados.
4. `suppliers`: Proveedores con balances pendientes.
5. `products`: Catálogo con costos, precios y márgenes.
6. `sales`: Ventas de comprobantes con idempotency key.
7. `sale_items`: Líneas de venta con snapshot inmutable de precios.
8. `expenses`: Gastos operativos por categoría.
9. `receivables`: Cuentas por cobrar amortizables.
10. `receivable_payments`: Historial de cobros inmutables.
11. `payables`: Cuentas por pagar a proveedores.
12. `payable_payments`: Historial de pagos inmutables.
13. `quotes`: Presupuestos / Cotizaciones comerciales.
14. `quote_items`: Líneas de presupuesto.
15. `tasks`: Gestión operativa de tareas y estados.
16. `documents`: Metadatos de archivos físicos vinculados a Storage.
17. `audit_logs`: Registro inmutable (Append-Only) de eventos del sistema.

---

## 3. Funciones Transaccionales Server-Side (RPCs en PostgreSQL)
1. `create_sale_transaction`: Inserción atómica de venta, líneas de venta y cuenta por cobrar con validación de totales.
2. `record_receivable_payment_transaction`: Cobro con bloqueo pesimista `FOR UPDATE`, prevención de sobrepago e idempotencia.
3. `record_payable_payment_transaction`: Pago con bloqueo pesimista `FOR UPDATE`, prevención de sobrepago e idempotencia.

---

## 4. Variables de Entorno y Secretos

| Variable | Tipo | Consumo | Estado |
| :--- | :---: | :---: | :---: |
| `VITE_SUPABASE_URL` | Pública | Frontend | Configurada hacia proyecto `ychqcwbpzmjpsbowzvpk` |
| `VITE_SUPABASE_ANON_KEY` | Pública | Frontend | Configurada con RLS habilitado |
| `VITE_DATA_MODE` | Pública | Frontend | `supabase` (producción) / `local` (offline) |
| `SUPABASE_SERVICE_ROLE_KEY` | Privada | Servidor / Migraciones | Protegida (No expuesta en bundle) |
| `GEMINI_API_KEY` | Privada | Supabase Edge Functions | Protegida (No expuesta en bundle) |
