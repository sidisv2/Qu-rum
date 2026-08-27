# PLAN DE LANZAMIENTO: FASE 6 — BETA CONTROLADA & PRIMEROS USUARIOS (DIREX)
## Estrategia de Onboarding, Feedback, Métricas y Estabilidad Operativa

**Fecha:** 27 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Objetivo:** Guiar el ingreso de las primeras 5 a 20 PyMEs en un entorno de producción real, recolectar telemetría y ajustar la experiencia de usuario.

---

## 1. Pilares de la Fase 6

### A. Onboarding Acelerado de PyMEs (Time-to-Value < 5 mins)
1. **Asistente de Configuración Inicial (Wizard):**
   - Configuración de datos fiscales (Razón Social, CUIT/Tax ID, Moneda principal ARS/USD).
   - Carga inicial o importación CSV de Catálogo de Productos y Clientes.
2. **Plantillas Preconfiguradas por Industria:**
   - Servicios / Consultoría (Servicios recurrentes, CxC a 30/60 días).
   - Comercio / Distribución (Márgenes por categoría, control de stock y proveedores).
   - Manufactura / Talleres (Presupuestos, órdenes de trabajo y pagos parciales).

---

### B. Canales de Feedback y Experiencia de Usuario (In-App)
1. **Widget de Feedback Directo:**
   - Botón discreto en barra lateral: *"Enviar Sugerencia / Reportar Error"*.
   - Captura automática de vista actual, rol y versión del bundle sin incluir datos financieros privados.
2. **Registro de Dudas al Director IA:**
   - Auditoría de las preguntas más frecuentes de los dueños de PyMEs para enriquecer las sugerencias del sistema.

---

### C. Métricas Operativas y Telemetría Ética
- **Tasas de Conversión de Cotizaciones a Ventas.**
- **Tiempo Promedio de Cobro de Cuentas en Mora.**
- **Frecuencia de Uso del Director IA por Tenant.**
- **Tiempos de Respuesta de la Edge Function (Target < 2.5s).**

---

### D. Checklist de Monitoreo en Tiempo Real
- [ ] Monitoreo de logs en Supabase Dashboard (`Realtime` / `Edge Function logs`).
- [ ] Verificación de cuotas en OpenRouter (`openrouter.ai/activity`).
- [ ] Control de límites de almacenamiento en bucket `documents`.
- [ ] Tasa de éxito en transacciones financieras (Target: 100% ACID sin inconsistencias).
