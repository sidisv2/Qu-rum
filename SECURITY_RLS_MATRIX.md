# MATRIZ DE SEGURIDAD Y POLÍTICAS RLS — DIREX

| Tabla | SELECT | INSERT | UPDATE | DELETE | Aislamiento Multi-Tenant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `organizations` | Miembros | Autenticado | Owner/Admin | Owner | `id IN (SELECT org_id FROM org_members)` |
| `organization_members` | Miembros | Owner/Admin | Owner/Admin | Owner/Admin | `is_org_member(organization_id)` |
| `customers` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` + Soft Delete |
| `suppliers` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` + Soft Delete |
| `products` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` + Soft Delete |
| `sales` | Miembros | RPC Transaccional | Admin/Owner | Prohibido | `is_org_member(organization_id)` |
| `sale_items` | Miembros | RPC Transaccional | Prohibido | Prohibido | Inmutable / Snapshot histórico |
| `expenses` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` |
| `receivables` | Miembros | RPC Transaccional | RPC Transaccional | Prohibido | Bloqueo pesimista `FOR UPDATE` |
| `receivable_payments`| Miembros | RPC Transaccional | Prohibido | Prohibido | Inmutable / `idempotency_key` |
| `payables` | Miembros | Miembros | RPC Transaccional | Prohibido | Bloqueo pesimista `FOR UPDATE` |
| `payable_payments` | Miembros | RPC Transaccional | Prohibido | Prohibido | Inmutable / `idempotency_key` |
| `quotes` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` |
| `quote_items` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` |
| `tasks` | Miembros | Miembros | Miembros | Miembros | `is_org_member(organization_id)` |
| `documents` | Miembros | Miembros | Miembros | Admin/Owner | `is_org_member(organization_id)` |
| `audit_logs` | Miembros (Admin) | Sistema / Backend | Prohibido (Rule) | Prohibido (Rule) | Append-Only inmutable |
| `storage.objects` (`documents`)| Autenticado | Autenticado | Autenticado | Autenticado | `(storage.foldername(name))[1]::uuid` |
