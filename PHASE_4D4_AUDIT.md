# AUDITORÍA TÉCNICA — SUBFASE 4D.4: CUENTAS POR COBRAR, PAGAR Y REGISTRO DE PAGOS

## 1. Inspección del Esquema Relacional Existente (PostgreSQL)
Las 4 tablas base ya existen en `supabase/migrations/20260826000000_initial_schema.sql`:
1. `public.receivables`:
   - Columnas: `id`, `organization_id`, `sale_id`, `sale_number`, `customer_id`, `customer_name`, `amount`, `balance`, `due_date`, `status` (`paid`, `partial`, `pending`, `overdue`), `overdue_days`, `notes`, `created_at`, `updated_at`.
   - Constraints: `amount > 0`, `balance >= 0`.
2. `public.receivable_payments`:
   - Columnas: `id`, `organization_id`, `receivable_id`, `amount`, `payment_date`, `payment_method`, `reference`, `notes`, `created_by`, `created_at`.
   - Constraints: `amount > 0`.
3. `public.payables`:
   - Columnas: `id`, `organization_id`, `expense_id`, `supplier_id`, `supplier_name`, `amount`, `balance`, `due_date`, `status`, `notes`, `created_at`, `updated_at`.
   - Constraints: `amount > 0`, `balance >= 0`.
4. `public.payable_payments`:
   - Columnas: `id`, `organization_id`, `payable_id`, `amount`, `payment_date`, `payment_method`, `reference`, `notes`, `created_by`, `created_at`.
   - Constraints: `amount > 0`.

---

## 2. Diagnóstico de Necesidades y Transaccionalidad
- **Prevención de Race Conditions:** Se necesita una RPC PostgreSQL `record_receivable_payment_transaction` y `record_payable_payment_transaction` con `SELECT ... FOR UPDATE` para evitar sobrepagos simultáneos por múltiples usuarios.
- **Idempotencia:** Incorporación opcional de columna `idempotency_key` en `receivable_payments` y `payable_payments` con índice único por organización.
- **Contrato `IDataRepository`:** Ampliar `getReceivables` y `getPayables` a `PaginatedResult<T>` y agregar `getReceivablePayments(receivableId)` y `getPayablePayments(payableId)`.
- **Invariantes Financieras:** `balance = amount - SUM(payments.amount)` y `status = paid ↔ balance = 0`.
