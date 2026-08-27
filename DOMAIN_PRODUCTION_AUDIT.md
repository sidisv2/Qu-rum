# Auditoría de Configuración y Dominio Oficial de Producción
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. DOMINIO OFICIAL

**`https://direx.online`**

---

## 2. ESTADO DE SERVICIOS E INFRAESTRUCTURA

### VERCEL
**PASS**
- `https://direx.online` responde con `HTTP 200 OK`.
- Header `server: Vercel` y certificado SSL activo (`strict-transport-security: max-age=63072000`).
- Las rutas SPA (`/dashboard`, `/sales`, `/customers`, `/subscription`) cargan directamente sin errores 404 ni caídas de routing.

### SUPABASE AUTH
**PASS**
- Flujos de registro, login y logout alineados con el origen `https://direx.online`.
- Fallbacks de redirección en `AuthContext.tsx` actualizados hacia `https://direx.online/`.

### CORS DE EDGE FUNCTIONS
**PASS**
- Origen `https://direx.online` explícitamente añadido y validado en todas las Edge Functions desplegadas (`director-ia`, `create-organization`, `create-subscription`).
- Respuestas en vivo retornan encabezado `Access-Control-Allow-Origin: https://direx.online`.

### DIRECTOR IA
**PASS**
- Invocación desde `https://direx.online` verificada en tiempo real.
- Inferencia con OpenRouter ejecutada con éxito (`HTTP 200 OK`).

### MERCADO PAGO
**PASS (SANDBOX VALIDADO)**
- `create-subscription` invocado con `backUrl: "https://direx.online/"`.
- Generación de `checkoutUrl` genuino de Preapproval en Sandbox de Mercado Pago (`HTTP 200 OK`).

### LOGIN / REGISTRO
**PASS**
- Modal `AuthModal` operativo sin dependencias de dominios legacy.

### REDIRECTS
**PASS**
- `https://direx.online` no realiza redirecciones anómalas ni reenvía a dominios antiguos.

### HTTPS & SSL
**PASS**
- Conexión TLS 1.3 / HSTS activa en la red perimetral de Vercel.

### RUTAS SPA
**PASS**
- Verificadas en vivo: `/`, `/dashboard`, `/sales`, `/customers`, `/subscription`, `/pricing` (todas con status 200).

---

## 3. DOMINIOS ANTIGUOS EN CÓDIGO Y ACCIÓN REALIZADA

| Dominio | Ubicación | Contexto | Estado |
|---|---|---|---|
| `quorum-psi-three.vercel.app` | Edge Functions CORS / Reportes | Alias técnico de Vercel / Histórico | Retenido como fallback en CORS; reemplazado en URLs activas. |
| `quorum-admin-ia.vercel.app` | `package.json` / Reportes | Nombre de paquete npm / Histórico | Sin impacto en runtime. |
| `direx.app` | Referencias históricas | Dominio alternativo | Mantenido en CORS de Edge Functions. |
| `direx.online` | `AuthContext.tsx`, Edge Functions | **DOMINIO CANÓNICO Y OFICIAL** | **ACTIVO Y PRIORITARIO** |

---

## 4. PROBLEMAS ENCONTRADOS

- **Ninguno.** La infraestructura perimetral de Vercel y los endpoints de Supabase responden de forma unificada bajo `https://direx.online`.

---

## 5. CAMBIOS REALIZADOS

1. **`src/context/AuthContext.tsx`:** Actualizadas las URLs de redirección por defecto a `https://direx.online/`.
2. **`supabase/functions/director-ia/index.ts`:** Añadido `https://direx.online` a la lista de orígenes permitidos de CORS.
3. **`supabase/functions/create-organization/index.ts`:** Añadido `https://direx.online` a la lista de orígenes permitidos de CORS.
4. **`supabase/functions/create-subscription/index.ts`:** Actualizado `back_url` por defecto a `https://direx.online` y soporte de CORS.
5. **`supabase/functions/director-ia/providers/openRouterProvider.ts`:** Referer de OpenRouter configurado a `https://direx.online`.
6. **Redespliegue en la Nube:** Las 3 Edge Functions fueron redesplegadas exitosamente en Supabase Cloud (`ychqcwbpzmjpsbowzvpk`).

---

## 6. ELEMENTOS NO COMPROBADOS

- Cobro real con tarjeta bancaria física fuera de Sandbox.

---

## 7. DICTAMEN FINAL

### 🟢 **DOMAIN READY FOR PRODUCTION**
