# SEGURIDAD Y MULTI-TENANCY — QUÓRUM

## 1. Aislamiento Multi-Tenant Estricto
- Cada entidad de negocio (`Customer`, `Sale`, `Expense`, `Receivable`, `Payable`, `Quote`, `Task`, `Document`, `AuditLog`) está obligatoriamente particionada por `organization_id`.
- Los datos de una empresa nunca se comparten ni filtran hacia otra organización.

## 2. Roles y Permisos
- **Owner:** Control total de organización, auditoría y facturación.
- **Admin:** Gestión completa de módulos comerciales, financieros y Director IA.
- **Member:** Carga de ventas, cobros y tareas asignadas.

## 3. Seguridad en la Capa de IA
- La IA nunca recibe información cruda externa ni secretos del servidor.
- Utiliza **Internal Business Tools** consolidadas para operar sobre métricas exactas calculadas previamente.
- No se envían API keys ni variables sensibles en el bundle cliente público.

## 4. Trazabilidad y Auditoría
- Cada creación, modificación, cobro, pago o recomendación aplicada por IA queda registrada con timestamp ISO, nombre de usuario y detalle en el módulo de auditoría.
