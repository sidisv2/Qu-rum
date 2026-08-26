# SEGURIDAD Y ROW LEVEL SECURITY (RLS) — DIREX (POSTGRESQL)

## 1. Estrategia Multi-Tenant de Servidor
A diferencia del filtrado puramente en cliente, el motor PostgreSQL aplica **Row Level Security (RLS)** en el 100% de las tablas multi-tenant. Aunque un atacante intente modificar o falsificar parámetros HTTP con un `organization_id` ajeno, la base de datos rechaza la consulta en el motor SQL.

---

## 2. Funciones de Autorización en Base de Datos

```sql
-- Verifica si el usuario autenticado pertenece a la organización
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verifica si el usuario es Owner o Admin de la organización
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 3. Matriz de Políticas RLS por Operación

| Tabla | `SELECT` | `INSERT` | `UPDATE` | `DELETE` |
|---|---|---|---|---|
| **organizations** | Miembros de la org | Auth User | Owner / Admin | Bloqueado |
| **organization_members** | Miembros de la org | Owner / Admin | Owner / Admin | Owner / Admin |
| **customers** | Miembros de la org | Miembros de la org | Miembros de la org | Owner / Admin (Soft Delete) |
| **products** | Miembros de la org | Miembros de la org | Miembros de la org | Owner / Admin |
| **sales & items** | Miembros de la org | Miembros de la org | Miembros de la org | Bloqueado (Integridad contable) |
| **expenses** | Miembros de la org | Miembros de la org | Miembros de la org | Owner / Admin |
| **receivables & payments** | Miembros de la org | Miembros de la org | Miembros de la org | Bloqueado |
| **audit_logs** | Miembros de la org | Miembros de la org | **INMUTABLE (Bloqueado)** | **INMUTABLE (Bloqueado)** |
