# AUDITORÍA DE POLÍTICAS RLS — FASE 4C (DIREX)

## 1. Verificación del Modelo de Membresía Multi-Tenant

La verificación de permisos en PostgreSQL se realiza consultando la tabla de membresías:

```sql
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 2. Casos de Prueba y Amenazas Mitigadas

| Caso de Prueba | Acción del Usuario | Resultado Esperado | Política RLS Aplicada |
|---|---|---|---|
| **Caso A** | Usuario A en Organización A consulta clientes | **PERMITIDO** | `SELECT ON customers USING (is_org_member(organization_id))` |
| **Caso B** | Usuario A intenta consultar datos de Organización B | **DENEGADO (0 filas)** | `is_org_member(org_b)` retorna `FALSE` |
| **Caso C** | Usuario A intenta insertar registro con `organization_id = org-b` | **RECHAZADO (Error RLS)** | `WITH CHECK (is_org_member(organization_id))` falla |
| **Caso D** | Usuario A modifica `currentOrg.id` en DevTools | **BLOQUEADO EN SERVIDOR** | La BD rechaza la consulta sin importar el frontend |
| **Caso E** | Usuario A intenta eliminar datos de Organización B | **DENEGADO** | `DELETE USING (is_org_admin(organization_id))` falla |
| **Caso F** | Rol `member` intenta eliminar clientes o documentos | **DENEGADO** | `is_org_admin` requiere rol `owner` o `admin` |
| **Caso G** | Inmutabilidad de Auditoría (`audit_logs`) | **BLOQUEADO** | No existen políticas `UPDATE` ni `DELETE` en `audit_logs` |
