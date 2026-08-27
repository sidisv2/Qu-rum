# ARQUITECTURA DE SEGURIDAD DEL DIRECTOR IA — DIREX
## Fase 5.1: OpenRouter Inferencia Server-Side, Control de Secretos y Prevención de Abuso

---

## 1. Principios de Seguridad
1. **Zero Secret Leakage:** La clave `OPENROUTER_API_KEY` vive exclusivamente como secreto en Supabase Edge Functions. **Nunca** se expone al cliente ni se incluye en variables `VITE_*`.
2. **Tenant Enforcement:** El `organization_id` no se confía al cliente; se valida server-side mediante el JWT del usuario autenticado y su membresía en `organization_members`.
3. **Acciones no destructivas:** La IA jamás ejecuta mutaciones financieras de forma directa; solo genera propuestas que requieren confirmación humana explícita (`requiresConfirmation: true`).
4. **Append-Only Auditing:** Toda consulta y acción sugerida por la IA se registra en `audit_logs` con `user_id`, `organization_id`, duración en ms y `X-Request-ID`.
