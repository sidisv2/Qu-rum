# POLÍTICA DE GESTIÓN DE SECRETOS Y LLM PROVIDERS — DIREX
## Fase 5.1: OpenRouter Exclusivity

1. **Variables Públicas del Frontend:**
   - `VITE_SUPABASE_URL`: Endpoint público de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Clave pública para clientes anónimos/autenticados con RLS.
   - `VITE_DATA_MODE`: `supabase` en producción / `local` en desarrollo.

2. **Variables Privadas Server-Side:**
   - `OPENROUTER_API_KEY`: Solo en Supabase Edge Functions Secrets.
   - `OPENROUTER_MODEL`: Solo en Supabase Edge Functions Secrets.
   - `SUPABASE_SERVICE_ROLE_KEY`: Solo en scripts fuera del bundle.

3. **Invariante:** Ninguna variable que comience con `VITE_` contendrá secretos de LLM o claves privadas de OpenRouter.
