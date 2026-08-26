# AUDITORÍA DE INTEGRIDAD FINANCIERA — DIREX

1. **Cálculo Server-Side Inmutable:**
   - La función PostgreSQL `create_sale_transaction` recalcula subtotal, descuentos e impuestos server-side sin confiar en datos numéricos manipulados del cliente.
2. **Control Pesimista de Concurrencia:**
   - Amortizaciones en `record_receivable_payment_transaction` y `record_payable_payment_transaction` bloquean la fila con `SELECT ... FOR UPDATE`, eliminando race conditions en pagos simultáneos.
3. **Control de Sobrepagos:**
   - Se arroja una excepción explícita si el monto del pago supera el saldo pendiente (`balance`).
4. **Idempotencia:**
   - Soporte para clave de idempotencia (`idempotency_key`) para evitar duplicaciones por reintentos de red o doble submit.
5. **Preservación de Snapshot de Catálogo:**
   - Las líneas de venta (`sale_items`) preservan el snapshot del precio unitario al momento de la venta, independientemente de futuros aumentos en el catálogo.
