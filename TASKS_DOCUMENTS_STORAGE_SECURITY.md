# MANUAL DE SEGURIDAD Y ARQUITECTURA: TASKS, DOCUMENTS Y STORAGE (DIREX)
## Subfase 4D.5 — Implementación Multi-Tenant Production-Grade

---

## 1. Arquitectura de Almacenamiento Cifrado y Tenant-Safe

En Direx, los archivos binarios (PDFs de facturas, contratos, imágenes de comprobantes, hojas de cálculo) se encuentran **completamente desacoplados de la base de datos relacional**.

### Estructura de Paths en Supabase Storage:
```text
{organization_id}/{document_id}/{sanitized_filename}
```
Ejemplo:
```text
3fa85f64-5717-4562-b3fc-2c963f66afa6/doc-1787776279572/factura_servicios_agosto.pdf
```

---

## 2. Aislamiento y Políticas de Acceso (Row Level Security en Storage)

1. **Bucket Privado:**
   - El bucket `documents` está configurado con `public = false`.
   - Ningún archivo es accesible mediante URLs públicas estáticas.
2. **Generación de Signed URLs:**
   - Las descargas y visualizaciones se efectúan exclusivamente a través de URLs firmadas criptográficamente con tiempo de expiración configurable (por defecto 3600 segundos).
3. **Validación de Jerarquía Multi-Tenant:**
   - Todo request a `storage.objects` exige que el usuario autenticado pertenezca a la organización indicada en el primer segmento de la ruta:
     `(storage.foldername(name))[1]::uuid` validado mediante la función `public.is_org_member(...)`.

---

## 3. Invariante Append-Only en `audit_logs`

Los registros de auditoría son inmutables y proporcionan trazabilidad legal y operativa completa.

- **Prohibición de `UPDATE`:** Protegido por Rule de PostgreSQL `ON UPDATE TO public.audit_logs DO INSTEAD NOTHING`.
- **Prohibición de `DELETE`:** Protegido por Rule de PostgreSQL `ON DELETE TO public.audit_logs DO INSTEAD NOTHING`.
- **Sanitización de Metadatos:** No se registran contraseñas, tokens JWT ni claves privadas en el campo `details`.

---

## 4. Gestión de Tareas (Tasks)

- Estados tipados: `pending`, `in_progress`, `completed`, `cancelled`.
- Prioridades: `urgent`, `high`, `medium`, `low`.
- Paginación server-side con búsqueda full-text y filtros por prioridad/estado.
- Vinculación opcional con entidades del sistema (`relatedEntityId` y `relatedEntityType`).
