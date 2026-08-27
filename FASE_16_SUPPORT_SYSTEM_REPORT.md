# Reporte de Sistema de Tickets y Centro de Soporte (Fase 16)
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Buzones Oficiales de Atención

- **Soporte Técnico y Bugs:** `soporte@direx.online`
- **Consultas Generales y Facturación:** `contacto@direx.online`

---

## 2. Esquema de Base de Datos y Aislamiento RLS

Migración: [`supabase/migrations/20260827000003_support_tickets.sql`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/supabase/migrations/20260827000003_support_tickets.sql)
- Tabla `public.support_tickets` creada con políticas RLS que aseguran que los miembros únicamente consulten e inserten tickets pertenecientes a sus organizaciones activas.

---

## 3. Edge Function de Despacho de Tickets

Desplegada en Supabase Cloud: `send-support-ticket`
- Endpoint: `https://ychqcwbpzmjpsbowzvpk.supabase.co/functions/v1/send-support-ticket`
- Enrutamiento inteligente según el tipo de incidente:
  - `bug` | `general_support` -> `soporte@direx.online`
  - `billing` | `feature_request` -> `contacto@direx.online`
- Generación determinística de identificador `#TICK-XXXXXX` y guardado server-side con Service Role.

---

## 4. Componentes y Navegación UI

1. **Botón Flotante "Soporte & Ayuda" ([`src/components/feedback/FeedbackWidget.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/feedback/FeedbackWidget.tsx)):**
   - Modal interactivo con selección de tipo de consulta, asunto, email de respuesta y confirmación con ID de ticket.
2. **Vista Dedicada /soporte ([`src/components/support/SupportView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/support/SupportView.tsx)):**
   - Tarjetas de contacto directo a `soporte@direx.online` y `contacto@direx.online`.
   - Formulario completo de apertura de tickets con historial de tickets recientes de la empresa.
3. **Navegación ([`src/lib/navigation/routes.ts`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/lib/navigation/routes.ts) & [`src/components/layout/Sidebar.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/layout/Sidebar.tsx)):**
   - Ruta semántica canónica: `/soporte` (con alias `/ayuda`).
   - Acceso desde el menú lateral en el grupo Configuración.

---

## 5. Resultados de Validación Técnica

- **TypeScript (`npx tsc --noEmit`):** **0 errores (PASS)**
- **Suite de Pruebas Automatizadas (`npm run test`):** **100/100 PASS (100% exitoso)**
- **Compilación de Producción (`npm run build`):** **Exit code 0 (Generado en 12.35s)**
- **Auditoría de Vulnerabilidades (`npm audit`):** **0 vulnerabilities**
