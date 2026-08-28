# Reporte de Corrección Crítica de UUID en Creación e Importación Masiva (Fase 30)
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Problema Identificado y Causa Raíz

- **Error en Runtime:** `invalid input syntax for type uuid: 'cust-imported'` / `'sup-imported'` al intentar insertar en Supabase tablas `sales` o `expenses`.
- **Causa:** La base de datos PostgreSQL de Supabase requiere que las claves foráneas `customer_id` y `supplier_id` sean `UUID` válidos o `NULL`. Al enviar cadenas sintéticas literales, la transacción fallaba.

---

## 2. Solución Integral Aplicada

### A. Capa de Repositorios ([`src/lib/repository/supabaseRepository.ts`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/lib/repository/supabaseRepository.ts))
- Se implementó la función validadora de formato RFC-4122 `isValidUuid(id)`.
- En `createSale` y `createExpense`:
  - Si `customerId` o `supplierId` no son UUIDs canónicos válidos, se convierten de forma segura e inmediata a `null`.

### B. Provisión Dinámica y Captura de UUIDs ([`src/context/OrgContext.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/context/OrgContext.tsx))
- `createCustomer` y `createSupplier` ahora devuelven la entidad recién creada (`Customer | undefined`, `Supplier | undefined`), permitiendo obtener de inmediato el UUID asignado por Supabase.

### C. Mapeo Extendido y Tolerante ([`src/components/import-csv/ImportCSVView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/import-csv/ImportCSVView.tsx))
- Detección de columnas compuestas: `row.Cliente_Proveedor`, `row.Importe`, `row.Concepto`, `row.Fecha`, `row.Estado`, `row.Tipo`.
- Vinculación estricta con UUIDs reales para clientes/proveedores existentes o aprovisionados en caliente.
- Aplicado en los flujos de **Ventas**, **Gastos** y **Movimientos Mixtos**.

---

## 3. Resultados de Validación Técnica

- **TypeScript (`npx tsc --noEmit`):** **0 errores (PASS)**
- **Suite de Pruebas Automatizadas (`npm run test`):** **100/100 PASS (100% exitoso)**
- **Compilación de Producción (`npm run build`):** **Exit code 0 (Generado en 10.08s)**
- **Auditoría de Vulnerabilidades (`npm audit`):** **0 vulnerabilities**
