# AUDITORÍA DE MIGRACIÓN DE PROVEEDOR LLM A OPENROUTER — FASE 5.1 (DIREX)
## Desacoplamiento de Gemini, Contrato LLMProvider y Protección de Secretos

**Fecha:** 27 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Objetivo:** Migrar el backend del Director IA desde Google Gemini hacia OpenRouter sin alterar contratos ni exponer secretos al frontend.

---

## 1. Diagnóstico del Proveedor Actual
- **Ubicación:** `supabase/functions/director-ia/index.ts`.
- **Integración Actual:** Fetch directo al endpoint de Google Gemini `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`.
- **Secreto Actual:** `GEMINI_API_KEY` obtenido vía `Deno.env.get("GEMINI_API_KEY")`.
- **Formato:** JSON específico de Gemini (`contents: [{ role: "user", parts: [{ text }] }]`).

---

## 2. Propuesta de Arquitectura con OpenRouter
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible chat format).
- **Nuevo Secreto:** `OPENROUTER_API_KEY` obtenido vía `Deno.env.get("OPENROUTER_API_KEY")` (100% server-side).
- **Configuración de Modelo:** `OPENROUTER_MODEL` con fallback predeterminado a `google/gemini-2.5-flash` o `anthropic/claude-3.5-sonnet`.
- **Abstracción Modular:** Creación de `supabase/functions/director-ia/providers/llmProvider.ts` y `supabase/functions/director-ia/providers/openRouterProvider.ts`.
- **Validación de Respuesta:** Filtro y parseo estructurado de la respuesta para garantizar cumplimiento del contrato `DirectorResponse` sin aceptar SQL ni mutaciones financieras directas.

---

## 3. Plan de Migración
1. Crear abstracción `LLMProvider` y la implementación `OpenRouterProvider` con validación de response y timeouts de 8s.
2. Actualizar `supabase/functions/director-ia/index.ts` para consumir `OpenRouterProvider`.
3. Actualizar la matriz de variables de entorno y documentación de seguridad eliminando menciones operativas de `GEMINI_API_KEY` y estableciendo `OPENROUTER_API_KEY`.
4. Extender la suite de tests en `src/lib/security/__tests__/productionSecurity.test.ts` para validar el comportamiento del nuevo proveedor, manejo de errores HTTP y validación de schemas.
