# PRODUCTION RUNBOOK & GUÍA DE DESPLIEGUE — DIREX
## Fase 5.1: OpenRouter + Supabase + Vercel

---

## 1. Despliegue del Frontend en Vercel
1. Conectar el repositorio GitHub `https://github.com/sidisv2/Qu-rum.git` en [Vercel Dashboard](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Configurar las **Environment Variables** en Vercel:
   - `VITE_DATA_MODE` = `supabase`
   - `VITE_SUPABASE_URL` = `https://ychqcwbpzmjpsbowzvpk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `[TU_ANON_KEY_DE_SUPABASE]`
   - `VITE_AUTH_REDIRECT_URL` = `https://tu-dominio-vercel.app/`
6. Desplegar (`Deploy`).

---

## 2. Despliegue de la Edge Function en Supabase con OpenRouter
1. Instalar Supabase CLI y autenticarse:
   ```bash
   npx supabase login
   npx supabase link --project-ref ychqcwbpzmjpsbowzvpk
   ```
2. Configurar el secreto de OpenRouter en Supabase:
   ```bash
   npx supabase secrets set OPENROUTER_API_KEY="[TU_OPENROUTER_API_KEY_PRIVADA]"
   npx supabase secrets set OPENROUTER_MODEL="google/gemini-2.5-flash"
   ```
3. Desplegar la Edge Function del Director IA:
   ```bash
   npx supabase functions deploy director-ia --no-verify-jwt=false
   ```

---

## 3. Procedimiento de Rotación de Secretos
- **Rotación de `OPENROUTER_API_KEY`:**
  1. Generar nueva clave en el panel de OpenRouter (`openrouter.ai/keys`).
  2. Ejecutar: `npx supabase secrets set OPENROUTER_API_KEY="NUEVA_CLAVE"`.
  3. La Edge Function tomará el nuevo secreto de forma instantánea sin interrumpir el frontend.
