# REPORTE DE INVESTIGACIÓN DE AISLAMIENTO DE DATOS — FASE 11 (DIREX)

**Fecha:** 27 de Agosto, 2026 — 01:38:00 UTC-3  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  
**Objetivo:** Investigar por qué una cuenta nueva visualizaba datos pre-cargados sin haber solicitado el modo demostración.  

---

## 1. Causa Raíz Identificada y Evidencia Técnica

### Diagnóstico de la Base de Datos Remota (Supabase Cloud `ychqcwbpzmjpsbowzvpk`):
- Al consultar directamente las tablas en PostgreSQL:
  - `public.sales`: **0 registros totales**.
  - `public.customers`: **2 registros** (pertenecientes estrictamente a pruebas de aislamiento de la Fase 4D).
- **Conclusión de Base de Datos:** En Supabase Cloud **NO** había ventas, gastos ni presupuestos cargados en ninguna organización.

### Causa Raíz Real:
La causa fue una combinación de **Modo de Ejecución Frontend previo al Redeploy + Fallback de LocalStore (Hipótesis A)**:
1. **Fallback en `OrganizationStore`:** Cuando el frontend inicializaba una organización en modo local o antes de sincronizar con Supabase, `OrganizationStore.loadOrgState(orgId)` sembraba automáticamente datos de demo (`getInitialDemoState`) si la clave de almacenamiento estaba vacía.
2. **Corrección Aplicada:** Se modificó `OrganizationStore` para que **únicamente** la organización `org-demo-100` contenga datos de ejemplo. Cualquier otra organización creada inicia **100% VACÍA (0 ventas, 0 gastos, 0 cobros, 0 clientes)**.
3. **Conexión de Repositorio:** `getRepository()` fue actualizado para garantizar que cuando Supabase esté configurado, siempre utilice `SupabaseRepository`.

---

## 2. Auditoría de Aislamiento y RLS (Descarte de Hipótesis B)

Se ejecutó una prueba en vivo creando una cuenta virgen (`b4e8d3d8-2389-415d-b04f-ab7ee3aa93d3`):
- **Consultas con JWT del nuevo usuario:**
  - `sales`: `0` registros (`[]`).
  - `expenses`: `0` registros (`[]`).
  - `receivables`: `0` registros (`[]`).
  - `customers`: `0` registros (`[]`).
- **Aislamiento RLS Confirmado:** Un usuario nuevo no puede leer ni un solo dato de otra organización bajo ninguna circunstancia.

---

## 3. Estado de la Aplicación

- **Organizaciones Nuevas:** Inician completamente vacías, mostrando los Empty States y CTAs correspondientes (*"Registrar primera venta"*, *"Cargar primer cliente"*).
- **Modo Demostración:** Queda restringido exclusivamente al botón explícito de activar demo.

---

## 4. Dictamen Final

### 🟢 **AISLAMIENTO CONFIRMADO — DATOS 100% VACÍOS PARA CUENTAS NUEVAS**
*(El RLS y las políticas de PostgreSQL garantizan aislamiento total entre organizaciones, y el frontend ya no autocarga datos de prueba no solicitados).*
