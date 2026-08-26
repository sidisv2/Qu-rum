# ARQUITECTURA DE SEGURIDAD DEL DIRECTOR IA — DIREX
## Fase 4E: Inferencia Server-Side, Control de Secretos y Prevención de Abuso

---

## 1. Principios de Diseño
1. **Zero Secret Leakage:** Ninguna clave de LLM (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.) se expone al cliente ni se incluye en variables `VITE_*`.
2. **Tenant Enforcement:** El `organization_id` no se confía al cliente; se valida server-side mediante el JWT del usuario autenticado y su membresía en `organization_members`.
3. **Acciones no destructivas:** La IA jamás ejecuta mutaciones financieras de forma directa; solo genera propuestas que requieren confirmación humana explícita.
4. **Append-Only Auditing:** Toda consulta y acción sugerida por la IA se registra en `audit_logs` con `user_id` y `organization_id` reales.
