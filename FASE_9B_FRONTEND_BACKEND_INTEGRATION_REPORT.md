# REPORTE DE INTEGRACIÓN FRONTEND-BACKEND DE SUSCRIPCIONES — FASE 9B (DIREX)

**Fecha:** 27 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Componente:** `src/components/subscription/SubscriptionView.tsx`  
**Backend:** Supabase Edge Function `create-subscription` + PostgreSQL RPC `get_founder_slots_count()`  

---

## 1. Modificaciones Realizadas en el Frontend

1. **Invocación Real a Edge Function:**
   - Se reemplazó la simulación por `supabase.functions.invoke("create-subscription", { body: { organizationId, planId, backUrl } })`.
   - Utiliza automáticamente el JWT del usuario autenticado.
   - Redirecciona en la misma ventana (`window.location.href = data.checkoutUrl`) para preservar la sesión.
   - Captura y muestra errores reales del backend (ej: *"El cupo de 10 clientes Fundadores se encuentra agotado"*).
2. **Contador Dinámico de Cupos de Fundador:**
   - Consulta reactiva a la RPC PostgreSQL `get_founder_slots_count()`.
   - Si los cupos activos alcanzan 10, la tarjeta del Plan Fundador se deshabilita automáticamente mostrando *"Cupo Agotado"*.
3. **Estado Real de la Suscripción:**
   - Consulta a la tabla `organization_subscriptions` por `organization_id` actual para mostrar el estado genuino (`trialing`, `active`, `past_due`, `canceled`).

---

## 2. Verificación de Secretos y Sandbox
- `MERCADOPAGO_ACCESS_TOKEN`: Configurado de forma aislada en Supabase Edge Functions Secrets.
- En modo sandbox / fallback seguro, la Edge Function genera el checkout point con prefijo de prueba.

---

## 3. Estado de Beta Testers
- Conservan estado `trialing` sin interrupciones.

---

## 4. Dictamen Final
### 🟢 **INTEGRACIÓN REAL CONFIRMADA**
