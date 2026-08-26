# ARQUITECTURA DE SOFTWARE — DIRECTOR ADMINISTRATIVO IA (QUORUM)

## 1. Vision General del Sistema
**Quorum** es una plataforma Web SaaS B2B Multi-Tenant disenada con enfoque **Desktop-First** (completamente responsive y preparada para PWA) para duenos, administradores y directivos de PyMEs.
Su objetivo principal es responder en segundos:
- Cuanto vendi?
- Cuanto gaste?
- Cuanto me deben?
- Que tengo que pagar?
- Que problemas tengo?
- Que deberia hacer hoy?

---

## 2. Pila Tecnologica (Tech Stack)

### Frontend & Core
- **Framework:** React 19 (SPA moderna, rapida y modular).
- **Tooling & Bundler:** Vite 6 + TypeScript 5.8 (Strict mode).
- **Estilos:** Design System CSS puro y variables custom (Tokens semanticos empresariales, sobrios y accesibles). Sin exceso de gradientes ni esteticas distractoras de IA.
- **Iconografia:** Lucide React.
- **Importacion / Parsing:** PapaParse (CSV robusto).
- **Graficos:** Graficos SVG/HTML nativos y estructurados, sobrios y legibles.

### Backend & Almacenamiento
- **Base de Datos & Auth:** Supabase (PostgreSQL + RLS + GoTrue Auth) + Capa de almacenamiento local reactiva con aislamiento multi-tenant estricto para modo demo o sin conexion inicial.
- **IA Engine:** Servicio modular multi-proveedor (AIService) que se conecta via OpenRouter / OpenAI API utilizando el modelo google/gemini-2.5-flash o configurable por .env.
- **Arquitectura IA:** Ejecucion mediante Internal Business Tools (getOverduePayments, getExpiringQuotes, getAtRiskCustomers, getExpenseAnomalies, getSalesSummary) con prompts orientados a resultados estructurados y accionables, con trazabilidad de costos y tokens.
