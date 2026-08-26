# AUDITORÍA DE SEGURIDAD Y HARDENING DE PRODUCCIÓN — FASE 4F (DIREX)
## Evaluación de Riesgos, Rate Limiting, Observabilidad y CORS

**Fecha:** 26 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Commit Auditado:** [`6a17e1d`](https://github.com/sidisv2/Qu-rum.git)  

---

## 1. Puntos Auditados

1. **CORS en Edge Functions:** La Edge Function `director-ia` tenía `Access-Control-Allow-Origin: *`. Requiere ser restringido para aceptar únicamente orígenes autorizados de la aplicación (`localhost:5173` en desarrollo y los dominios de producción en Vercel/Direx).
2. **Rate Limiting:** Falta una capa de rate limiting en memoria / base de datos por `user_id` + `organization_id` que devuelva HTTP 429 cuando un usuario supere las 20 consultas por minuto.
3. **Observabilidad y Correlation IDs:** Cada solicitud debe aceptar o generar un `X-Request-ID` para rastrear la traza completa desde el navegador hasta `audit_logs`.
4. **Vulnerabilidades de Dependencias:** Se ejecutó `npm audit` detectando 2 vulnerabilidades transitivas (`nanoid`, `postcss`) que fueron remediadas exitosamente mediante `npm audit fix` (**0 vulnerabilities**).
5. **Prompt Injection:** Tratar los datos de las organizaciones (nombres de clientes, comprobantes, notas) como bloques no confiables encerrados en etiquetas `<untrusted_context>` para evitar que redefinan el comportamiento del modelo.

---

## 2. Plan de Acción Inmediato
- Endurecer `supabase/functions/director-ia/index.ts` con rate limiting, validación de longitud de payload (max 2000 chars), timeout controlado (8s), `X-Request-ID` y mitigación de prompt injection.
- Crear suite integral de pruebas en `src/lib/security/__tests__/productionSecurity.test.ts`.
- Generar la documentación y políticas de observabilidad, rate limiting y matriz final de seguridad.
