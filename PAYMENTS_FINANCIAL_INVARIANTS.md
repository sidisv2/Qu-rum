# INVARIANTES FINANCIERAS DE PAGOS Y AMORTIZACIONES — DIREX

## 1. Invariantes del Modelo de Cuentas por Cobrar (Receivables)
1. `amount > 0`: Todo comprobante por cobrar debe tener un monto nominal positivo.
2. `balance >= 0`: El saldo pendiente no puede ser negativo bajo ninguna circunstancia.
3. `paid_amount = amount - balance`: El total amortizado es exactamente la diferencia entre el total nominal y el saldo remanente.
4. `SUM(receivable_payments.amount) = amount - balance`: La sumatoria de todos los pagos registrados debe coincidir exactamente con el monto amortizado.
5. `payment.amount <= current_balance`: No se permiten pagos que superen el saldo pendiente al momento de la transacción.
6. **Estados:**
   - `status = 'paid' ↔ balance = 0`
   - `status = 'partial' ↔ (balance > 0 AND balance < amount)`
   - `status = 'pending' ↔ (balance = amount AND current_date <= due_date)`
   - `status = 'overdue' ↔ (balance > 0 AND current_date > due_date)`

---

## 2. Invariantes del Modelo de Cuentas por Pagar (Payables)
1. `amount > 0`: Toda deuda con proveedor debe tener un monto nominal positivo.
2. `balance >= 0`: El saldo pendiente a pagar nunca puede ser menor a cero.
3. `SUM(payable_payments.amount) = amount - balance`: La sumatoria de pagos a proveedores equivale al total amortizado.
4. **Estados:** Idéntica máquina de estados derivativa basada en `balance` y `due_date`.
