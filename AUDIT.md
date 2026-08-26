# AUDITORÍA PROFUNDA Y HARDENING — DIREX (FASE 1)

## 1. Resumen Ejecutivo
- **Nombre Oficial del Producto:** **Direx** (Web SaaS B2B "Director Administrativo IA para PyMEs").
- **Estado General:** Arquitectura modular sólida con Frontend React 19 + TypeScript + Vite, estado reactivo aislado por `organization_id` y capas independientes para lógica contable/financiera e IA.
- **Veredicto de Auditoría:** Se detectaron 6 puntos de hardening prioritarios (Aislamiento en persistencia local por namespace de organización, cálculo de mora/fechas con timezone seguro UTC/local, validación estricta de floating point financiero, control de roles de usuario, validación de inputs contra inyección CSV y consistencia transaccional en borrado/cascada).

---

## 2. Clasificación de Riesgos y Hallazgos

| ID | Área | Descripción del Hallazgo | Nivel | Estado |
|---|---|---|---|---|
| SEC-01 | Multi-Tenancy | La persistencia en almacenamiento local guardaba un único bloque de estado global sin indexar estrictamente por `organization_id` independiente para cada empresa creada. | 🔴 Critical | Corregido |
| SEC-02 | Autorización | Falta de validación del rol (`owner`, `admin`, `member`) en acciones destructivas (eliminar clientes, gastos, cambiar datos de organización). | 🟠 High | Corregido |
| FIN-01 | Cálculos Financieros | Cálculos de márgenes y sumas financieras expuestos a inconsistencias de floating point de JavaScript (`0.1 + 0.2 != 0.3`). | 🟠 High | Corregido |
| DATE-01 | Fechas & Mora | `formatRelativeDays` y cálculo de atraso utilizaban `Math.ceil` directo sobre UTC sin normalizar horas del día, lo que generaba desfase de 1 día en zonas horarias UTC-3 (Argentina). | 🟠 High | Corregido |
| SEC-03 | CSV Import | Falta de sanitización contra CSV Formula Injection (`=CMD`, `+`, `-`, `@`) en campos importados. | 🟡 Medium | Corregido |
| DATA-01 | Integridad Relacional | Eliminación de clientes no validaba o advertía si existían ventas o cuentas por cobrar pendientes asociadas. | 🟡 Medium | Corregido |

---

## 3. Detalle de Vulnerabilidades y Correcciones Aplicadas

### 3.1. Multi-Tenancy Estricto y Almacenamiento Aislado (SEC-01)
- **Problema:** Si un usuario creaba una nueva organización, los datos anteriores no quedaban encapsulados en un contenedor aislado con clave única `org_store_<orgId>`.
- **Solución:** Se implementó partición estricta por `org_store_<orgId>`. Cada mutación valida que la entidad a insertar, actualizar o eliminar pertenezca al `currentOrg.id`. Cualquier intento de modificar un ID ajeno arroja error de aislamiento y registra alerta de seguridad en `AuditLog`.

### 3.2. Control de Roles y Permisos (SEC-02)
- **Problema:** Cualquier usuario con rol `member` podía borrar clientes o cambiar parámetros de la empresa.
- **Solución:** Se integró validación RBAC (`requirePermission(['owner', 'admin'])`). Los usuarios con rol `member` tienen acceso operativo restringido a carga de ventas/cobros sin permisos de eliminación irreversible.

### 3.3. Cálculos Financieros y Redondeo Seguro (FIN-01)
- **Problema:** Divisiones por cero potenciales o márgenes negativos desbordados.
- **Solución:** Nueva función utilitaria `safeRound(num, decimals)` y protección en `calculateMargin` con validación estricta contra valores `NaN`, infinitos y redondeo a 2 decimales en moneda.

### 3.4. Motor de Fechas y Timezone Seguro (DATE-01)
- **Problema:** En zona horaria UTC-3, las comparaciones `new Date(dueDate)` vs `new Date()` sin resetear la hora (`setHours(0,0,0,0)`) arrojaban falsos vencimientos.
- **Solución:** Normalización a fecha local a medianoche para cálculo exacto de días de mora.

### 3.5. Sanitización de CSV e Inyección de Fórmulas (SEC-03)
- **Problema:** Celdas CSV que comiencen con `=`, `@`, `+`, `-` podían ejecutar macros o corromper datos.
- **Solución:** Sanitización automática removiendo o escapando prefijos de fórmulas en `importBulkData`.

---

## 4. Tests y Validación de Calidad
- **Typecheck:** 0 errores en TypeScript 5.8 estricto.
- **Build Producción:** Vite 6 bundle compilado exitosamente en `dist/`.
- **Suite de Pruebas Automatizadas:** Creación y ejecución de test de aislamiento multi-tenant, permisos y cálculos financieros.
