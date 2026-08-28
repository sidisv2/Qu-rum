# Reporte de Cuotas Rentables de Director IA y Unit Economics (Fase 24)
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Calibración de Cuotas Mensuales

Para proteger los márgenes del negocio SaaS y los costos de inferencia en OpenRouter / Gemini, se eliminó la asignación ilimitada y se establecieron límites estructurados por plan:

| Plan | Límite Usuarios | Cuota Mensual Director IA | Valor Mensual |
| :--- | :---: | :---: | :---: |
| **Prueba Gratuita (Free)** | 1 usuario | 10 consultas (7 días) | $0 |
| **Plan Starter** | 2 usuarios | **75 consultas / mes** | $19.900 ARS |
| **Plan Fundador** | 5 usuarios | **200 consultas / mes** | $9.900 ARS |
| **Plan Pro** | 10 usuarios | **500 consultas / mes** | $44.900 ARS |

---

## 2. Implementación Aplicada

1. **`src/lib/subscription/planLimits.ts`:**
   - Tipo numérico estricto `aiMonthlyQuota: number`.
   - `canQueryAI` valida el consumo mensual contra la cuota definida (`75`, `200`, `500`) retornando el motivo de bloqueo y opciones de upgrade al alcanzar el tope.

2. **`src/components/subscription/SubscriptionView.tsx`:**
   - En la tarjeta activa: *"Tu empresa cuenta con {quota} consultas mensuales de Director IA y cobros inteligentes."*
   - Listado de features actualizado con el detalle exacto de consultas mensuales.

3. **`src/components/director-ia/DirectorIAView.tsx`:**
   - Badge dinámico en el encabezado:
     - En Free: `"Prueba: X / 10 consultas"`
     - En Planes Activos: `"Consumo mes: X / 200 consultas"` (o `75`/`500` según el plan).

---

## 3. Resultados de Validación Técnica

- **TypeScript (`npx tsc --noEmit`):** **0 errores (PASS)**
- **Suite de Pruebas Automatizadas (`npm run test`):** **100/100 PASS (100% exitoso)**
- **Compilación de Producción (`npm run build`):** **Exit code 0 (Generado en 9.36s)**
- **Auditoría de Vulnerabilidades (`npm audit`):** **0 vulnerabilities**
