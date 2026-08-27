# MANUAL DE HARDENING DE PRODUCCIÓN — DIREX
## Subfase 4F: Seguridad, Observabilidad y Políticas de Despliegue

---

## 1. Rate Limiting Server-Side
- **Ventana:** 60 segundos (Sliding Window).
- **Límite:** 20 solicitudes por minuto por `user_id`.
- **Respuesta:** HTTP 429 (`RATE_LIMITED`).

## 2. Inmunidad a Prompt Injection
- **Defensa:** Aislamiento mediante etiquetas XML `<financial_context>` y `<user_prompt>`.
- **Instrucción Inmutable:** El modelo no ejecuta comandos administrativos, mutaciones financieras directas ni modificaciones del esquema relacional.

## 3. Observabilidad y Correlation IDs
- **Cabecera:** `X-Request-ID` propagada en todas las respuestas de la Edge Function.
- **Trazabilidad:** Cada invocación registra duración en milisegundos, usuario, organización y estado en `audit_logs`.

## 4. CORS Endurecido
- **Permitidos:** `http://localhost:5173`, `http://127.0.0.1:5173`, `https://direx.app`, `https://quorum-psi-three.vercel.app`.
