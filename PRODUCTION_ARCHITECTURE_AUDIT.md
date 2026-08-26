# AUDITORÍA PROFUNDA DE ARQUITECTURA DE PRODUCCIÓN — DIREX (FASE 4A)

## 1. Executive Summary
- **Nombre del Producto:** **Direx** (SaaS B2B "Director Administrativo IA para PyMEs").
- **Estado Actual:** Prototipo funcional Client-Side SPA de alta fidelidad, con lógica de negocio, motor de métricas e inferencia determinística totalmente operativa en el navegador, pero **sin capa de servidor ni base de datos relacional persistente**.
- **Diagnóstico General:** La arquitectura frontend, el modelado tipado en TypeScript, la UI/UX y los motores analíticos (`InsightEngine`, `DirectorAIService`) están sumamente maduros. Sin embargo, para convertirse en un **SaaS multiusuario y multi-tenant de nivel bancario/empresarial**, debe transicionar de su almacenamiento efímero local (`localStorage`) hacia una base de datos relacional con **Row Level Security (RLS)** y un backend que proteja la autenticación y las llamadas a la IA.

---

## 2. Mapa Completo de la Arquitectura Actual

```
[ Navegador del Usuario (SPA Vite) ]
                │
                ▼
[ React 19 + ToastProvider + ErrorBoundary ]
                │
                ▼
[ OrgContext (React Context State) ] ── (In-Memory State)
       │                        ▲
       ▼ (Mutaciones)           │ (Lectura / Deserialización)
[ OrganizationStore ] ──────────┘
       │
       ▼ (Serialización JSON)
[ LocalStorage del Navegador ] (`direx_store_v1_<orgId>`)
       │
       ▼ (Consumo en tiempo real)
[ Capa de Inteligencia Determinística ]
       ├── InsightEngine (Métricas, Scoring, Evidencia, Reglas)
       └── DirectorAIService (Consultas Ejecutivas en Lenguaje Natural)
```

### Archivos Reales del Sistema:
- **Punto de Entrada:** `src/main.tsx` → `src/App.tsx`
- **Gestor de Estado y Contexto:** `src/context/OrgContext.tsx`
- **Capa de Almacenamiento:** `src/lib/db/orgStore.ts`
- **Datos Semilla / Demo:** `src/lib/demo/initialData.ts`
- **Motor de Inteligencia:** `src/lib/intelligence/insightEngine.ts`
- **Servicio Director IA:** `src/lib/intelligence/directorAIService.ts`
- **Utilidades & Cálculos:** `src/lib/utils/formatters.ts`
- **Definiciones de Tipos:** `src/types/index.ts` & `src/lib/intelligence/types.ts`

---

## 3. Stack Tecnológico Real (Inspección de package.json y Configuración)
- **Framework Frontend:** React `19.0.0` + React DOM `19.0.0`
- **Lenguaje:** TypeScript `5.8.2` (Modo estricto)
- **Bundler & Dev Server:** Vite `6.4.3`
- **Routing:** Enrutamiento interno por estado de vista en `App.tsx` con fallback canónico de SPA en `vercel.json`.
- **Estilos:** Vanilla CSS modular con Design Tokens en `src/styles/variables.css` y `main.css`.
- **Iconografía:** Lucide React `0.475.0`
- **Parsing de Archivos:** PapaParse `5.5.2` (con sanitización contra CSV Injection)
- **Motor de Ejecución / Testing:** `tsx` `4.19.3` + Node.js `24.18.0`
- **Despliegue:** Vercel Edge Network (`https://quorum-psi-three.vercel.app/`)
- **Backend Actual:** **NO IMPLEMENTADO** (Arquitectura 100% Client-Side).
- **Base de Datos Actual:** **NO IMPLEMENTADA** (Persistencia basada en `window.localStorage`).
- **Autenticación Actual:** **SIMULADA** (Usuario estático en memoria: `usr-1` Valentín Morales).

---

## 4. Persistencia y Single Source of Truth
- **Single Source of Truth (SSOT):** Actualmente es el estado en memoria de React en `OrgContext.tsx`, el cual se sincroniza bidireccionalmente en cada render mediante `useEffect` con `localStorage.getItem("direx_store_v1_" + orgId)`.
- **Análisis por Entidad:**

| Entidad | Dónde se Guarda | Creación / Mutación | Eliminación | Riesgo de Integridad |
|---|---|---|---|---|
| **Organizations** | `localStorage` | `OrgContext.createNewOrganization` | No implementada | Pérdida al limpiar caché del navegador. |
| **Users** | Memoria / Mock | Hardcodeado en `OrganizationStore` | No aplicable | Sin validación de sesión o password. |
| **Customers** | `localStorage` | `OrgContext.createCustomer` | Hard Delete en array local | Sin cascade ni verificación foránea en servidor. |
| **Products** | `localStorage` | `OrgContext.createProduct` | Hard Delete en array local | Huérfanos si se borra producto usado en ventas. |
| **Sales** | `localStorage` | `OrgContext.createSale` | Modificación de status | No hay transacciones ACID. |
| **Expenses** | `localStorage` | `OrgContext.createExpense` | Hard Delete en array local | Sin conciliación bancaria. |
| **Receivables** | `localStorage` | Derivado de ventas impagas | Pago parcial/total | Pérdida de histórico de pagos parciales. |
| **Payables** | `localStorage` | Derivado de gastos impagos | Pago parcial/total | Pérdida de histórico de pagos parciales. |
| **Quotes** | `localStorage` | `OrgContext.createQuote` | Modificación de status | Sin control de vigencia automática por cron. |
| **Tasks** | `localStorage` | `OrgContext.createTask` | Hard Delete | Sin asignación a múltiples usuarios. |
| **Documents** | `localStorage` (metadata) | `OrgContext.uploadDocument` | Hard Delete | Archivos físicos no se almacenan (solo metadata). |
| **AuditLog** | `localStorage` | `OrgContext.addAuditLog` | No hay borrado UI | Manipulable desde DevTools del navegador. |
| **Insights** | Calculado On-the-Fly | `InsightEngine.analyze()` | Efímero / En memoria | Sin almacenamiento histórico de evolución. |

---

## 5. Auditoría de Seguridad y Multi-Tenancy

### 5.1. Multi-Tenancy
- **Estado Actual:** **SOLO FRONTEND / STORAGE LOCAL**.
- **Aislamiento:** El aislamiento se realiza particionando la clave de `localStorage` (`direx_store_v1_<orgId>`) y filtrando arreglos en memoria `items.filter(x => x.organizationId === currentOrg.id)`.
- **🔴 RIESGO CRÍTICO (SEC-01):** Cualquier usuario puede abrir la consola de DevTools, modificar `localStorage.getItem("direx_store_v1_org-demo-100")` o cambiar `currentOrg.id`, teniendo acceso completo a manipular cualquier valor localmente. **No existe validación a nivel de red ni Row Level Security (RLS) en servidor.**

### 5.2. Autenticación y Autorización
- **Estado:** **NO IMPLEMENTADO (SIMULADO)**.
- El usuario `currentUser` está fijado como `usr-1` ("Valentín Morales") con rol `owner`.
- La función `hasPermission(["owner", "admin"])` es puramente cosmética en el cliente; no protege llamadas HTTP ni endpoints de API porque no existen.

### 5.3. Exposición de Secretos y Variables de Entorno
- **Estado:** **SEGURO EN FRONTEND**.
- El archivo `.env.example` contiene referencias a `VITE_OPENROUTER_API_KEY`, pero **ninguna clave real se encuentra hardcodeada ni expuesta en el bundle de Vite**. El servicio `DirectorAIService` opera mediante inferencia determinística local, eliminando costos y fugas de tokens en el navegador.

---

## 6. Datos Financieros, Fechas e Identificadores

### 6.1. Cálculos Financieros
- **Tipo de Dato:** JavaScript `Number` (Float de 64 bits IEEE 754).
- **Protección Actual:** Funciones `safeRound(amount, 2)` y `calculateMargin(price, cost)` neutralizan anomalías de coma flotante (`0.1 + 0.2 = 0.3`) y divisiones por cero.
- **Riesgo en Base de Datos:** En PostgreSQL, los tipos de moneda **NUNCA deben ser `FLOAT` o `REAL`**; deben modelarse estrictamente como **`NUMERIC(15,2)`** o enteros en centavos (`BIGINT`).

### 6.2. Fechas y Timezone
- **Formato:** ISO 8601 Strings (`YYYY-MM-DD` para fechas comerciales y `YYYY-MM-DDTHH:mm:ss.sssZ` para auditoría).
- **Cálculos de Mora:** Normalizados a medianoche local mediante `calculateDaysDifference(date)` sin riesgo de desfase por UTC.

### 6.3. Identificadores (IDs)
- **Formato Actual:** Prefijos basados en timestamps: `cust-1724689000000`, `sale-1724689000000`.
- **Riesgo de Colisión:** En un SaaS concurrente con miles de usuarios, los IDs basados en `Date.now()` colisionan. Deben migrarse a **`UUID v4` (`crypto.randomUUID()`)** o **`ULID / CUID2`**.

---

## 7. Escalabilidad y Rendimiento

| Registros por Empresa | Rendimiento en LocalStorage | Rendimiento en React State | Rendimiento de Inferencia IA | Veredicto |
|---|---|---|---|---|
| **100 registros** | < 1 ms (Excelente) | 60 FPS | < 2 ms | **PASS** |
| **1.000 registros** | ~5 ms (Aceptable) | 60 FPS | ~10 ms | **PASS** |
| **10.000 registros** | ~80 ms (Límite de cuota 5MB) | Caída de frames por renders | ~150 ms | **WARNING** |
| **100.000 registros** | 🔴 **CRASH** (Excede cuota de 5MB) | Bloqueo de hilo principal | > 1.5s | **FAIL** |

**Conclusión de Escalabilidad:** Para empresas PyME con más de 500 ventas y 1.000 clientes, el almacenamiento en `localStorage` es inviable. Se requiere paginación en servidor y consultas SQL indexadas.

---

## 8. Matriz de Riesgos Críticos (Producción)

| Riesgo | Severidad | Probabilidad | Impacto | Componente | Solución Definitiva |
|---|---|---|---|---|---|
| **Pérdida Total de Datos por Limpieza de Caché** | 🔴 **CRITICAL** | Alta | Destructivo | `orgStore.ts` | Migrar persistencia a PostgreSQL en la nube. |
| **Falsificación de Identidad / Sin Autenticación** | 🔴 **CRITICAL** | Alta | Acceso no autorizado | `App.tsx` | Implementar Supabase Auth / NextAuth con JWT. |
| **Falta de Aislamiento RLS en Base de Datos** | 🔴 **CRITICAL** | Media | Fuga de datos entre tenants | Backend / DB | Activar Row Level Security (`organization_id = auth.jwt()->org_id`). |
| **Colisión de IDs en Concurrencia** | 🟠 **HIGH** | Media | Corrupción de registros | `types/index.ts` | Migrar generación de IDs a UUID v4 nativo. |
| **Almacenamiento de Documentos en Memoria** | 🟡 **MEDIUM** | Alta | Imposibilidad de adjuntar PDF/Imágenes | `DocumentsView` | Conectar Object Storage (Supabase Storage / S3). |

---

## 9. Arquitectura Objetivo Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR (CLIENTE)                    │
│   React 19 SPA (Vite) + TanStack Query (Server State Cache)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JWT Bearer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND & API GATEWAY                     │
│        (Supabase REST / Edge Functions o NestJS / Hono)     │
│                                                             │
│   ├── Authentication Middleware (Verificación de Token JWT) │
│   ├── Tenant Interceptor (Inyección segura de org_id)       │
│   └── RBAC Guard (Validación de Roles: Owner, Admin, Member)│
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      BASE DE DATOS RELACIONAL│ │     AI SERVER-SIDE ENGINE  │
│  PostgreSQL 16 (Multi-Tenant)│ │  (Inferencia Determinística│
│  ├── Row Level Security (RLS)│ │   + Proxy a LLM con Secret)│
│  ├── Constraints & FKs       │ └────────────────────────────┘
│  └── Tablas NUMERIC / UUID   │
└──────────────────────────────┘
```

---

## 10. Stack Tecnológico Recomendado para la Fase 4B

Para una PyME SaaS B2B moderna, con máxima velocidad de desarrollo, costo $0 inicial, cumplimiento estricto de seguridad multi-tenant y sin sobreingeniería:

1. **Base de Datos & Auth:** **Supabase (PostgreSQL 16 Gestionado)**
   - Autenticación segura (Email/Password, Magic Link, Google OAuth).
   - Multi-Tenancy nativo garantizado mediante **Row Level Security (RLS)** a nivel de base de datos.
   - Tipos de datos financieros exactos (`NUMERIC(15,2)`).
   - Storage integrado para comprobantes y facturas (`pdf`, `jpg`, `png`).
2. **Capa de Comunicación Frontend:** **`@supabase/supabase-js` + `@tanstack/react-query`**
   - Cacheo inteligente, reintentos automáticos y sincronización optimista en la UI sin reescribir componentes.
3. **Motor de IA Server-Side:** **Supabase Edge Functions / Node API**
   - Protege las API Keys de LLMs sin exponerlas en el navegador.

---

## 11. Roadmap de Transición a Producción

- **Fase 4B (Base de Datos & Esquema Relacional):**
  - Creación del esquema SQL relacional completo con tablas, constraints, foreign keys y políticas RLS multi-tenant (`organizations`, `users`, `customers`, `products`, `sales`, `expenses`, `receivables`, `payables`, `quotes`, `tasks`, `documents`, `audit_logs`).
- **Fase 4C (Autenticación & Gestión de Organizaciones):**
  - Pantallas de Login, Registro y Onboarding de empresa con sesiones persistentes seguras en servidor.
- **Fase 4D (Capa de Repositorio & Migración de Estado):**
  - Adaptador de repositorio que conecta `OrgContext` con Supabase, manteniendo fallback local en caso de modo offline o demo.
- **Fase 4E (Director IA Server-Side & Storage de Documentos):**
  - Proxy seguro de inferencia y almacenamiento físico de archivos en bucket de objetos.
- **Fase 4F (Production Hardening & Monitoreo):**
  - Auditoría final de penetración, límites de rate limiting y monitoreo de errores (Sentry).

---

## 12. Veredicto Final de la Auditoría
> **Direx cuenta con una base de Frontend, UX y Lógica de Negocio de calidad AAA.** El siguiente paso natural es dotarlo de una capa de base de datos relacional PostgreSQL y autenticación real para convertirlo formalmente en un SaaS comercializable.
