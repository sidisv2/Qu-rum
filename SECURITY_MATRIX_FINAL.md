# MATRIZ FINAL DE SEGURIDAD Y ESTADO DE ENDURECIMIENTO — DIREX

| Componente | Control de Seguridad | Estado | Evidencia |
| :--- | :--- | :---: | :--- |
| **Auth JWT** | Verificación criptográfica en Edge Function | ✅ PASS | Rechaza 401 ante token ausente/inválido |
| **Multi-Tenancy** | `organization_id` derivado exclusivamente de DB | ✅ PASS | Previene falsificación de tenant desde el body |
| **Rate Limiting** | Límite de 20 req/min por usuario | ✅ PASS | Devuelve HTTP 429 (`RATE_LIMITED`) |
| **Prompt Injection** | Delimitación estricta `<financial_context>` / `<user_prompt>` | ✅ PASS | 4/4 ataques neutralizados en suite de test |
| **Secrets** | Cero variables `VITE_*` con API keys de LLM | ✅ PASS | Verificado en bundle de Vite y `.env.example` |
| **Storage** | Bucket privado + Signed URLs tenant-isolated | ✅ PASS | Rechaza accesos cruzados entre organizaciones |
| **PostgreSQL RLS** | 17 tablas relacionales protegidas | ✅ PASS | Cobertura 100% en todas las entidades |
| **Financial RPCs** | `FOR UPDATE` + Totales calculados en servidor | ✅ PASS | Cero drift financiero y prevención de sobrepagos |
| **Dependencies** | `npm audit` | ✅ PASS | 0 vulnerabilities reportadas |
