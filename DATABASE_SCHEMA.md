# ESQUEMA DE BASE DE DATOS RELACIONAL — DIREX (POSTGRESQL 16)

## 1. Reglas Generales del Esquema
- **Claves Primarias:** Todos los IDs usan `UUID` generados con `gen_random_uuid()`.
- **Aislamiento Multi-Tenant:** Toda entidad de negocio contiene `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
- **Precisión Financiera:** Todas las columnas monetarias usan `NUMERIC(15,2)` con constraints `>= 0` para evitar estados contables imposibles o fallas de coma flotante.
- **Historial Inmutable:** `sale_items` almacena snapshots de `unit_price` y `unit_cost` al momento de la venta para que futuras modificaciones del producto no alteren balances históricos.

---

## 2. Mapa de Tablas y Relaciones (17 Tablas)

```
[ organizations ] (Tenant Root)
   ├── [ organization_members ] (RBAC: owner, admin, member)
   ├── [ customers ] ──< [ sales ] ──< [ sale_items ]
   │       │               │
   │       │               └──< [ receivables ] ──< [ receivable_payments ]
   │       └──< [ quotes ] ──< [ quote_items ]
   ├── [ suppliers ] ──< [ expenses ] ──< [ payables ] ──< [ payable_payments ]
   ├── [ products ]
   ├── [ tasks ]
   ├── [ documents ]
   └── [ audit_logs ] (Inmutable)
```

---

## 3. Detalle de Tablas Principales

### `organizations`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name VARCHAR(255) NOT NULL`
- `tax_id VARCHAR(50)`
- `country VARCHAR(2) DEFAULT 'AR'`
- `currency VARCHAR(3) DEFAULT 'ARS'`
- `timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires'`
- `is_demo BOOLEAN DEFAULT FALSE`

### `organization_members`
- `organization_id UUID REFERENCES organizations(id)`
- `user_id UUID NOT NULL`
- `role VARCHAR(20) CHECK (role IN ('owner', 'admin', 'member'))`
- `CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)`

### `customers`
- `id UUID PRIMARY KEY`
- `organization_id UUID REFERENCES organizations(id)`
- `name VARCHAR(255) NOT NULL`
- `total_spent NUMERIC(15,2) DEFAULT 0.00`
- `total_pending_debt NUMERIC(15,2) DEFAULT 0.00`
- `deleted_at TIMESTAMPTZ` (Soft delete)

### `sales` & `sale_items`
- `sales`: `total NUMERIC(15,2)`, `paid_amount NUMERIC(15,2)`, `status CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled'))`
- `sale_items`: `unit_price NUMERIC(15,2)`, `unit_cost NUMERIC(15,2)`, `quantity NUMERIC(10,2)`

### `receivables` & `receivable_payments`
- `receivables`: `balance NUMERIC(15,2)`, `due_date DATE`, `status CHECK (status IN ('paid', 'partial', 'pending', 'overdue'))`
- `receivable_payments`: `amount NUMERIC(15,2)`, `payment_date DATE`, `payment_method VARCHAR(50)`

---

## 4. Índices de Rendimiento
- `idx_sales_org_date`: `(organization_id, sale_date DESC)`
- `idx_receivables_org_due`: `(organization_id, due_date, status)`
- `idx_expenses_org_date`: `(organization_id, expense_date DESC)`
- `idx_customers_org_status`: `(organization_id, status)`
- `idx_audit_org_created`: `(organization_id, created_at DESC)`
