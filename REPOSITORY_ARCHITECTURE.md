# ARQUITECTURA DE REPOSITORIOS — DIREX

## 1. Principio de Inversión de Dependencias
Los componentes React y el contexto de estado (`OrgContext`) no conocen detalles de la base de datos ni interactúan directamente con `@supabase/supabase-js`. Dependen únicamente del contrato `IDataRepository`.

```
[ OrgContext ] ──> [ IDataRepository (Interface) ]
                          ▲              ▲
                          │              │
           [ LocalRepository ]    [ SupabaseRepository ]
```

---

## 2. Implementaciones
1. **`LocalRepository`:** Utilizado para Modo Demo, Desarrollo Offline y pruebas unitarias rápidas sin dependencias de red. Persiste en `localStorage` con aislamiento indexado.
2. **`SupabaseRepository`:** Conecta de forma segura con PostgreSQL 16 utilizando el cliente Supabase y tokens de sesión JWT, validando RLS en cada operación.

---

## 3. Selector de Repositorio Dinámico
La función `getRepository()` lee la variable de entorno `VITE_DATA_MODE`:
- Si `VITE_DATA_MODE=supabase` y las credenciales están configuradas: activa `SupabaseRepository`.
- Si falta configuración o está en modo local: activa `LocalRepository` con fallback seguro.
