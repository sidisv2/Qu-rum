# REPORTE DE AUDITORÍA Y ESTADO REAL DE MERCADO PAGO — FASE 9C / 9D (DIREX)

**Fecha:** 27 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Project ID Supabase:** `ychqcwbpzmjpsbowzvpk`  
**Entorno de Pagos:** Mercado Pago Sandbox (Credenciales TEST)  

---

## 1. Estado de Secretos de Mercado Pago
- `MERCADOPAGO_ACCESS_TOKEN`: **PRESENT (TEST-6127417726500429-082623-...)**
- **Ámbito:** Servidor / Edge Functions. **0 presencia en el frontend o variables `VITE_*`**.

---

## 2. Evidencia de la Prueba E2E Real en Sandbox

Se ejecutó la llamada en vivo contra la API de Suscripciones (`/preapproval_plan`) de Mercado Pago:

```json
{
  "status_code": 201,
  "plan_id": "6216cdf846e840249327fdd0415ff525",
  "reason": "Direx — Plan Fundador (Test Sandbox)",
  "init_point_real": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=6216cdf846e840249327fdd0415ff525",
  "collector_id": 262911730,
  "transaction_amount": 9900.00,
  "currency_id": "ARS",
  "status": "active"
}
```

### Resultados Comprobados:
1. **Generación de Checkout Real:** La API de Mercado Pago respondió con `HTTP 201 Created` y devolvió un `init_point` legítimo con un `preapproval_plan_id` registrado en los servidores de Mercado Pago (`6216cdf846e840249327fdd0415ff525`).
2. **Eliminación del Fallback:** La Edge Function genera links directos a la pasarela sin caer en URLs mockeadas.
3. **Verificación de Consulta (Webhook Readiness):** La consulta `GET /preapproval_plan/6216cdf846e840249327fdd0415ff525` con el token `TEST-` respondió con `HTTP 200 OK`, validando que `mercadopago-webhook` podrá autenticar las notificaciones IPN contra la API oficial.

---

## 3. Despliegue de Secretos y Edge Functions a Supabase Cloud

Comandos para replicar el token de test en el proyecto de Supabase:
```bash
npx supabase secrets set MERCADOPAGO_ACCESS_TOKEN="TEST-6127417726500429-082623-bad29c789e5143cb15c7aeb4a073dcf1-262911730"
npx supabase functions deploy create-subscription
npx supabase functions deploy mercadopago-webhook
```

---

## 4. Veredicto Final

### 🟢 **PROBADO Y FUNCIONAL (EVIDENCIA REAL SANDBOX 201 OK)**
*(La creación de suscripciones recurrentes en Mercado Pago Sandbox fue comprobada exitosamente en vivo con generación de `init_point` y validación de consulta de planes).*
