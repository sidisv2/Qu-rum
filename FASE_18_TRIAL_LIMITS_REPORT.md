# Reporte de Enforcement de Límites Estrictos — Plan Free / Trialing (Fase 18)
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Restricciones Aplicadas al Estado `trialing` (Plan Free)

| Parámetro | Límite Plan Free (Trialing) | Planes Pagos (Fundador / Starter / Pro) |
|---|---|---|
| **Duración** | **7 días** desde creación de la empresa | **Recurrente Activo** |
| **Miembros del Equipo** | **1 usuario máximo** (bloqueo en invitación) | **2 a 10 usuarios** |
| **Consultas Director IA** | **10 consultas en total** (bloqueo server y client) | **50/mes o Ilimitado** |
| **Operaciones Máximas** | **Hasta 15 comprobantes** | **Ilimitado** |

---

## 2. Implementación por Componente

1. **Servicio Central ([`src/lib/subscription/planLimits.ts`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/lib/subscription/planLimits.ts)):**
   - `getTrialDaysRemaining(createdAt)`: Calcula de forma determinística la ventana de 7 días.
   - `canAddMember`: Bloquea colaboradores adicionales en `trialing` (`maxUsers: 1`).
   - `canQueryAI`: Aplica tope estricto de 10 consultas y detecta expiración de los 7 días.

2. **Vista de Suscripción ([`src/components/subscription/SubscriptionView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/subscription/SubscriptionView.tsx)):**
   - Tarjeta superior dinámica:
     - En `trialing`: Muestra `"Estado: Plan de Prueba (Free)"`, días restantes y cupo de 10 consultas.
     - Si expiran los 7 días: Muestra `"Estado: Período de Prueba Expirado (EXPIRED)"` con alerta roja.
     - En `active`: Muestra `"Estado: Suscripción Activa"`.

3. **Director IA ([`src/components/director-ia/DirectorIAView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/director-ia/DirectorIAView.tsx) & Edge Function `director-ia`):**
   - **Frontend:** Badge `"X consultas Free restantes"`, validación previa al envío y mensaje interactivo de upgrade.
   - **Server-Side:** Edge Function [`supabase/functions/director-ia/index.ts`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/supabase/functions/director-ia/index.ts) cuenta consultas reales en `ai_messages` y bloquea con `HTTP 403 TRIAL_LIMIT_EXCEEDED` al alcanzar 10 peticiones en `trialing`. Redesplegada exitosamente en Supabase Cloud.

---

## 3. Resultados de Validación Técnica

- **TypeScript (`npx tsc --noEmit`):** **0 errores (PASS)**
- **Suite de Pruebas Automatizadas (`npm run test`):** **100/100 PASS (100% exitoso)**
- **Compilación de Producción (`npm run build`):** **Exit code 0 (Generado en 15.12s)**
- **Auditoría de Vulnerabilidades (`npm audit`):** **0 vulnerabilities**
