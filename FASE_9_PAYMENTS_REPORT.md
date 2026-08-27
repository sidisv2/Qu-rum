# REPORTE DE INTEGRACIÓN DE MERCADO PAGO Y SISTEMA DE PLANES — FASE 9 (DIREX)

**Fecha:** 27 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Project ID Supabase:** `ychqcwbpzmjpsbowzvpk`  
**Mecanismo de Pago:** Mercado Pago Preapproval (Suscripciones Recurrentes Mensuales)  

---

## 1. Política y Seguridad de Secretos
- **`MERCADOPAGO_ACCESS_TOKEN`:** Vive exclusivamente como secreto en Supabase Edge Functions (`create-subscription` y `mercadopago-webhook`). **0 presencia en el frontend o variables `VITE_*`**.

---

## 2. Estructura de Planes y Cupos

| Plan | Precio Mensual (ARS) | Usuarios Máximos | Cupos / Condiciones |
| :--- | :---: | :---: | :--- |
| **Plan Fundador** | **$9.900** | Hasta 5 | **Exclusivo para los primeros 10 clientes** (Precio congelado por 12 meses). |
| **Plan Starter** | **$19.900** | Hasta 2 | Disponible estándar. |
| **Plan Pro** | **$44.900** | Hasta 10 | Multiusuario con almacenamiento y soporte extendido. |

- **Contador Automático de Cupos:** La función SQL `get_founder_slots_count()` bloquea la contratación del Plan Fundador una vez alcanzados los 10 registros activos.

---

## 3. Arquitectura Server-Side de Pagos
1. **Edge Function `create-subscription`:**
   - Valida permisos de `owner`/`admin`.
   - Consulta cupos de fundador.
   - Crea el `preapproval_plan` en la API de Mercado Pago y devuelve el `init_point` seguro.
2. **Edge Function `mercadopago-webhook`:**
   - Recibe notificaciones IPN/webhooks.
   - Verifica el estado consultando directamente la API de Mercado Pago (`https://api.mercadopago.com/preapproval/{id}`).
   - Actualiza `organization_subscriptions.status` (`active`, `past_due`, `canceled`).

---

## 4. Estado de los Beta Testers Actuales
- Los usuarios iniciales se conservan en estado **`trialing`** sin corte de servicio, permitiendo que continúen utilizando todas las funciones de forma gratuita durante la fase beta.

---

## 5. Dictamen Final
### 🟢 **LISTO PARA COBRAR (READY FOR SUBSCRIPTIONS)**
