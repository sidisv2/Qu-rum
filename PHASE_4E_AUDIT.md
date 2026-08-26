# AUDITORÍA TÉCNICA Y DE SEGURIDAD PREVIA — FASE 4E (DIREX)
## Director IA Server-Side, Gestión de Secretos y Autorización Multi-Tenant

**Fecha:** 26 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Commit Base:** [`e6b82c0`](https://github.com/sidisv2/Qu-rum.git)  
**Objetivo:** Diseñar la arquitectura server-side del Director IA con aislamiento multi-tenant, control estricto de secretos y validación de acciones.

---

## 1. Arquitectura Actual vs Propuesta

### Arquitectura Actual (Client-Side In-Memory):
- `DirectorIAView.tsx` consume `useOrg()`.
- Llama a `DirectorAIService.answerExecutiveQuery` pasándole datos en memoria cargados en el cliente.
- **Riesgo:** Inadecuado para volúmenes masivos de datos y sin integración con LLMs avanzados en la nube debido al riesgo de exponer API keys en el navegador.

### Arquitectura Propuesta (Server-Side / Supabase Edge Functions):
- **Cliente:** `DirectorIAView.tsx` envía la consulta a la Edge Function `/functions/v1/director-ia` con el header `Authorization: Bearer <SUPABASE_JWT>`.
- **Edge Function:**
  1. Valida el token JWT contra Supabase Auth y extrae `user_id`.
  2. Resuelve la pertenencia a la organización en `organization_members`.
  3. Ejecuta agregaciones financieras y analíticas server-side en PostgreSQL (`InsightEngine` server-side / SQL aggregates).
  4. Delimita el prompt con System Instructions inmutables + datos financieros de negocio.
  5. Invoca a **Google Gemini 2.5 Flash / OpenAI** utilizando la clave privada (`GEMINI_API_KEY` o `OPENROUTER_API_KEY`) almacenada exclusivamente en variables de entorno del servidor.
  6. Devuelve una respuesta fuertemente tipada (`DirectorResponse`).
  7. Registra un `audit_log` con tipo `DIRECTOR_REQUEST`.

---

## 2. Auditoría de Secretos y Dependencias

- **Bundle Cliente (Vite/React):** 100% limpio. No contiene ninguna variable `VITE_GEMINI_API_KEY` ni `VITE_OPENAI_API_KEY`.
- **Variables de Entorno Servidor:**
  - `OPENAI_API_KEY=` (Server-side only)
  - `GEMINI_API_KEY=` (Server-side only)
  - `SUPABASE_SERVICE_ROLE_KEY=` (Server-side only)
- **Modo Local:** Si `VITE_DATA_MODE=local`, se utiliza el mock determinístico `LocalDirectorService` en memoria sin requerir conexión a APIs externas ni Supabase.

---

## 3. Contrato de Acciones del Director (Seguridad Financiera)

1. **Acciones de Lectura / Diagnóstico:** Libres dentro de la organización del usuario autenticado.
2. **Acciones de Propuesta (e.g. `create_task`):** El Director IA genera un payload estructurado `{ type: "create_task", payload: {...} }`. El frontend muestra un modal de confirmación y el usuario debe aprobar explícitamente la creación.
3. **Mutaciones Financieras:** **Estrictamente Prohibidas para ejecución directa por IA**. El Director solo puede sugerir (e.g., "Cobrar factura #104"). La ejecución real debe ser realizada por el usuario a través de los formularios y RPCs transaccionales validados (`create_sale_transaction`, `record_receivable_payment_transaction`).

---

## 4. Archivos a Crear y Modificar en la Fase 4E

- **Nuevos:**
  - `supabase/functions/director-ia/index.ts` (Edge function server-side con Deno runtime).
  - `src/lib/intelligence/directorContract.ts` (Tipos `DirectorRequest`, `DirectorResponse`, `DirectorAction`, etc.).
  - `src/lib/intelligence/serverDirectorService.ts` (Cliente que invoca la función server-side con JWT).
  - `src/lib/intelligence/localDirectorService.ts` (Mock determinístico para modo local y tests).
  - `src/lib/intelligence/__tests__/directorSecurity.test.ts` (Suite de pruebas de seguridad y aislamiento).
  - `AI_SECURITY_ARCHITECTURE.md`
  - `DIRECTOR_ACTION_CONTRACT.md`
  - `AI_SECRETS_POLICY.md`
  - `PHASE_4E_REPORT.md`
- **Modificados:**
  - `src/components/director-ia/DirectorIAView.tsx` (Adaptar consumo del nuevo contrato y propuestas de acciones).
  - `src/lib/intelligence/directorAIService.ts` (Enrutar a server-side o local según `VITE_DATA_MODE`).
  - `.env.example` (Incluir variables server-side documentadas).
