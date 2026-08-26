# PLAN DE IMPLEMENTACIÓN — FASE 4B: SUPABASE POSTGRESQL + RLS + REPOSITORIOS

## 1. Contexto y Objetivos
- **Producto:** Direx (SaaS B2B "Director Administrativo IA para PyMEs").
- **Objetivo Central:** Construir la base de persistencia relacional PostgreSQL con Row Level Security (RLS) estricto y una arquitectura de repositorios agnóstica (`DataRepository` interface), permitiendo alternar sin fricción entre `LocalRepository` (Modo Demo/Offline) y `SupabaseRepository` (Cloud Multi-Tenant) sin romper la UI ni exponer secretos.

---

## 2. Diagrama de Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                      UI / Vistas React                      │
│     (Dashboard, Mi Día, Clientes, Ventas, Director IA)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         OrgContext                          │
│             (Gestión de Estado Reactivo en UI)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ Consume
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 IDataRepository (Interface)                 │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼ (VITE_DATA_MODE=local)        ▼ (VITE_DATA_MODE=supabase)
┌──────────────────────────────┐ ┌────────────────────────────┐
│       LocalRepository        │ │     SupabaseRepository     │
│   (OrganizationStore /       │ │     (@supabase/supabase-js │
│    LocalStorage persistente) │ │      con RLS y Session)    │
└──────────────────────────────┘ └──────────────┬─────────────┘
                                                │ HTTPS / JWT Bearer
                                                ▼
                                 ┌────────────────────────────┐
                                 │     PostgreSQL 16 (Cloud)  │
                                 │     - 17 Tablas Tipadas    │
                                 │     - RLS Multi-Tenant     │
                                 │     - RBAC (Owner/Admin/M) │
                                 │     - NUMERIC(15,2) Exacto │
                                 └────────────────────────────┘
```

---

## 3. Modelo de Entidades Relacionales (17 Tablas)

1. **`organizations`**: Tenants comerciales (`id UUID`, `name`, `tax_id`, `currency`, `timezone`, `created_at`, `updated_at`).
2. **`organization_members`**: Vínculo con usuarios (`organization_id`, `user_id`, `role: owner/admin/member`).
3. **`customers`**: Clientes con soft delete (`organization_id`, `name`, `tax_id`, `email`, `phone`, `status`, `deleted_at`).
4. **`suppliers`**: Proveedores (`organization_id`, `name`, `tax_id`, `contact_name`, `deleted_at`).
5. **`products`**: Catálogo con montos exactos (`organization_id`, `name`, `sku`, `price NUMERIC(15,2)`, `cost NUMERIC(15,2)`, `active`).
6. **`sales`**: Cabecera de venta (`organization_id`, `customer_id`, `sale_number`, `sale_date`, `subtotal`, `total`, `paid_amount`, `status`).
7. **`sale_items`**: Detalle inmutable con snapshot de costo y precio (`sale_id`, `product_id`, `description`, `quantity`, `unit_price`, `unit_cost`, `subtotal`).
8. **`expenses`**: Egresos operativos (`organization_id`, `supplier_id`, `category`, `amount NUMERIC(15,2)`, `expense_date`, `status`).
9. **`receivables`**: Cuentas a cobrar persistentes (`organization_id`, `sale_id`, `customer_id`, `original_amount`, `outstanding_amount`, `due_date`, `status`).
10. **`receivable_payments`**: Historial de amortizaciones (`organization_id`, `receivable_id`, `amount`, `payment_date`, `payment_method`).
11. **`payables`**: Cuentas a pagar a proveedores (`organization_id`, `expense_id`, `supplier_id`, `original_amount`, `outstanding_amount`, `due_date`, `status`).
12. **`payable_payments`**: Historial de pagos realizados (`organization_id`, `payable_id`, `amount`, `payment_date`).
13. **`quotes`**: Presupuestos / Cotizaciones (`organization_id`, `customer_id`, `quote_number`, `total`, `valid_until`, `status`).
14. **`quote_items`**: Ítems cotizados (`quote_id`, `product_id`, `description`, `quantity`, `unit_price`, `subtotal`).
15. **`tasks`**: Tareas administrativas y acciones de IA (`organization_id`, `title`, `priority`, `status`, `due_date`, `assigned_to`).
16. **`documents`**: Metadatos de archivos/facturas (`organization_id`, `name`, `storage_path`, `mime_type`, `size_bytes`).
17. **`audit_logs`**: Trazabilidad inmutable (`organization_id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata JSONB`, `created_at`).

---

## 4. Políticas de Seguridad RLS y RBAC

- **Función Reutilizable:** `is_org_member(org_id UUID)` verifica que `auth.uid()` pertenezca a `organization_members` para la organización solicitada.
- **Función Administrativa:** `is_org_admin(org_id UUID)` verifica roles `owner` o `admin`.
- **Reglas RLS:**
  - **`SELECT`**: Permitido a miembros de la organización.
  - **`INSERT`**: Validado por pertenencia a la organización en servidor.
  - **`UPDATE`**: Permitido a miembros (o administradores según criticidad).
  - **`DELETE`**: Restringido a `owner` y `admin` con protección estricta en ventas históricas y auditoría (no borrado en audit logs).

---

## 5. Estrategia de Compatibilidad y Rollback
- Si `VITE_DATA_MODE=supabase` y no hay conexión o credenciales, se realiza un fallback controlado a `LocalRepository` advirtiendo en consola sin provocar pantalla en blanco.
- Los tests automatizados validan que tanto `LocalRepository` como la capa de persistencia abstracta cumplan la misma interfaz `IDataRepository`.
