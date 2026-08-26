# PLAN DE PRUEBAS END-TO-END — DIREX

1. **Flujo de Autenticación y Sesión:**
   - Registro → Login → Creación de Organización → Validación de Membresía y Roles (`owner`, `admin`, `member`).
2. **Flujo de Maestros:**
   - Creación de Clientes, Proveedores y Productos aislados por `organization_id`.
3. **Flujo Financiero:**
   - Creación de Venta con líneas asociadas → Generación automática de Cuenta por Cobrar (`Receivable`) → Pagos parciales → Extinción de deuda → Prevención de sobrepago.
4. **Flujo Documental:**
   - Subida de archivo físico binario a bucket privado de Storage → Registro de metadatos en `documents` → Generación de Signed URL para descarga segura.
5. **Flujo de Tareas y Auditoría:**
   - Creación de tareas → Actualización de estado → Registro inmutable en `audit_logs` con garantía Append-Only.
6. **Aislamiento Multi-Tenant:**
   - Intento deliberado de acceder a entidades de Organización A desde Organización B → Rechazo garantizado por RLS y Storage Policies.
