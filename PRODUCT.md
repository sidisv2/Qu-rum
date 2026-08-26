# PRODUCT & UX SPECIFICATION — DIRECTOR ADMINISTRATIVO IA (QUÓRUM)

## Propuesta de Valor
> **"Entendé cómo está tu negocio y sabé qué deberías hacer hoy."**

Quórum es una plataforma SaaS B2B administrativa orientada a dueños y directivos de PyMEs. En menos de 10 segundos responde:
1. ¿Cuánto vendí?
2. ¿Cuánto gasté?
3. ¿Cuánto me deben?
4. ¿Qué tengo que pagar?
5. ¿Qué problemas tengo?
6. ¿Qué debería hacer hoy?

---

## Módulos Implementados
- **Dashboard Principal:** KPIs en tiempo real (Ventas, Gastos, Cobros pendientes, Pagos a proveedores, Flujo de caja, Margen bruto).
- **Sección Prominente "Requiere Atención":** Alertas accionables con prioridad alta/media generadas sobre datos reales de mora, presupuestos por caducar y desvíos de costos.
- **Director IA:** Asistente ejecutivo con herramientas internas de análisis (`getOverduePayments`, `getExpiringQuotes`, `getAtRiskCustomers`, `getExpenseAnomalies`, `getSalesSummary`).
- **Clientes:** CRM administrativo, historial de compra, frecuencias y saldo deudor.
- **Ventas & Facturación:** Registro de órdenes con cálculo automático de cuentas a cobrar.
- **Gastos & Egresos:** Control de costos y detección de anomalías porcentuales.
- **Cobros (Cuentas a Cobrar):** Antigüedad de deuda, estados de cobro y registro de pagos.
- **Pagos (Cuentas a Pagar):** Control de vencimientos a proveedores y pronto pago.
- **Presupuestos / Cotizaciones:** Pipeline comercial, fechas límite y conversión.
- **Productos / Servicios:** Catálogo con cálculo automático de margen bruto (`$ y %`).
- **Proveedores:** Gestión de compras y condiciones comerciales.
- **Tareas de Gestión:** Seguimiento operativo con sugerencias de la IA.
- **Documentos:** Repositorio estructurado para comprobantes y contratos (PWA / OCR ready).
- **Análisis Financiero:** Estructura de gastos por categoría y margen operativo.
- **Importador CSV Universal:** Carga masiva con validación y preview previo.
- **Auditoría & Seguridad:** Log inmutable de cada transacción y recomendación ejecutada.
- **Configuración & Multi-Tenancy:** Aislamiento estricto de datos por `organization_id`.
