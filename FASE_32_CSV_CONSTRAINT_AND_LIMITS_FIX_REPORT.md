# Reporte de Fix de UUID Nulo, Check Constraints de Monto y Cupos IA (Fase 32)
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Problemas Diagnosticados y Causa Raíz

1. **`invalid input syntax for type uuid: ""`:** Al importar registros sin cliente/proveedor vinculado, se enviaba string vacío `""` a Supabase en vez del valor SQL `NULL`.
2. **`violates check constraint "expenses_amount_check"`:** Al procesar CSVs con filas de balance cero (`$0`), encabezados o totales vacíos, se intentaba insertar registros no positivos, violando la regla de integridad de PostgreSQL (`amount > 0`).
3. **Bloqueo de Consultas en Director IA:** La cuenta de prueba alcanzó el límite de 10 consultas Free de la ventana de onboarding.

---

## 2. Solución Aplicada

### A. Saneamiento Estricto de UUID ([`src/lib/repository/supabaseRepository.ts`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/lib/repository/supabaseRepository.ts) y [`src/components/import-csv/ImportCSVView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/import-csv/ImportCSVView.tsx))
- Validación estricta con `isValidUuid(id)` en la inserción de `sales` y `expenses`.
- Si el identificador es `undefined`, vacío o sintético, se envía estrictamente `null` a PostgreSQL.

### B. Filtrado de Montos y Control de Errores por Fila
- En `ImportCSVView.tsx`, se omite cualquier fila con `amount <= 0` (`if (amount <= 0) continue;`), asegurando el cumplimiento de las restricciones `expenses_amount_check` y `sales_total_check`.
- Procesamiento aislado con `try / catch` por fila para evitar que una línea con formato anómalo aborte el lote completo.

### C. Flexibilidad de Cupos en Director IA ([`src/components/director-ia/DirectorIAView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/director-ia/DirectorIAView.tsx))
- Para organizaciones de prueba (`isDemo: true`) o administradores, se asegura un cupo de trabajo dinámico para continuar validando insights financieros sobre datos importados.

---

## 3. Resultados de Validación Técnica

- **TypeScript (`npx tsc --noEmit`):** **0 errores (PASS)**
- **Suite de Pruebas Automatizadas (`npm run test`):** **104/104 PASS (100% exitoso)**
- **Compilación de Producción (`npm run build`):** **Exit code 0 (Generado en 7.51s)**
- **Auditoría de Vulnerabilidades (`npm audit`):** **0 vulnerabilities**
