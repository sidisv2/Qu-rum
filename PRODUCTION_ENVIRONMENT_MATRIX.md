# MATRIZ DE VARIABLES DE ENTORNO Y SECRETOS DE PRODUCCIÓN — DIREX
## Fase 5.1: OpenRouter Integration & Zero Secret Leakage

| Variable | Tipo | Ámbito | Destino (Vercel / Supabase) | Propósito y Requisitos |
| :--- | :---: | :---: | :---: | :--- |
| `VITE_SUPABASE_URL` | **Pública** | Frontend (Vite) | **Vercel** (Environment Variables) | URL base de Supabase (`https://ychqcwbpzmjpsbowzvpk.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | **Pública** | Frontend (Vite) | **Vercel** (Environment Variables) | Anon/Public API Key para clientes con RLS activo. |
| `VITE_DATA_MODE` | **Pública** | Frontend (Vite) | **Vercel** (Environment Variables) | Modo de persistencia (`supabase` en producción). |
| `VITE_AUTH_REDIRECT_URL` | **Pública** | Frontend (Vite) | **Vercel** (Environment Variables) | URL de redirección de autenticación. |
| `OPENROUTER_API_KEY` | **Privada** | Server-Side | **Supabase** (Edge Function Secrets) | API Key de OpenRouter para inferencia LLM. **NUNCA en el frontend**. |
| `OPENROUTER_MODEL` | **Privada** | Server-Side | **Supabase** (Edge Function Secrets) | Modelo configurado (Default: `google/gemini-2.5-flash`). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Privada** | Server-Side | **Supabase** (CLI / Admin only) | Clave administrativa para migraciones y scripts fuera del bundle. |
