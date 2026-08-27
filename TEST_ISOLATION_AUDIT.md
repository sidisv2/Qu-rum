# Auditoría de Aislamiento de Tests y Regresión Estructural
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Problema Encontrado

Al ejecutar la suite de pruebas global (`npm run test`), el runner reportaba **98/100 PASS (2 fallas)**:
1. `[FAIL] Storage deniega generación de URL firmada a ORG_B sobre path de ORG_A`
2. `[FAIL] Aislamiento Total: ORG_B no puede acceder a ningún dato de ORG_A`

Sin embargo, al ejecutar la suite E2E de forma aislada en un subproceso individual, el resultado era **12/12 PASS (0 fallas)**.

---

## 2. Causa Raíz

Se identificaron dos fuentes concurrentes de contaminación entre suites en el entorno Node de testing:

1. **Colisión de ID de Organizaciones por granularidad de Timestamp (`Date.now()`):**
   - En `LocalRepository.createOrganization()`, el identificador se generaba como `"org-" + Date.now()`.
   - Cuando se ejecutaban suites de forma síncrona y continua en un único proceso de Node, `createOrganization` para `orgA` y `orgB` ocurría en el mismo milisegundo.
   - Como resultado: `orgA.id === orgB.id` (ejemplo registrado: `org-1787842553623` para ambas organizaciones).
   - Al coincidir el ID de ambas organizaciones, `storage.getSignedUrl(orgB.id, upDoc.storagePath)` no arrojaba excepción de acceso denegado porque el path `${orgA.id}/...` coincidía exactamente con `orgB.id`.
2. **Persistencia del Singleton de Almacenamiento (`storageRepoInstance`):**
   - `getStorageRepository()` conservaba una instancia singleton en memoria entre distintas suites sin un mecanismo de reinicio para pruebas secuenciales.
3. **Persistencia de `memoryStore` en `OrganizationStore`:**
   - En entornos Node (sin `window.localStorage`), el objeto `memoryStore` acumulaba claves de organizaciones de suites anteriores.

---

## 3. Archivos Afectados

- `src/lib/repository/localRepository.ts`
- `src/lib/db/orgStore.ts`
- `src/lib/storage/index.ts`
- `src/test/run-all-tests.ts`

---

## 4. Corrección Aplicada

1. **Unicidad Criptográfica de IDs en LocalRepository:**
   - Se actualizó `LocalRepository.createOrganization` para generar identificadores con entropía aleatoria: `"org-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9)`.
   - Se garantiza que cada organización creada tenga un estado aislado e independiente en `OrganizationStore`.
2. **Método de Reseteo `OrganizationStore.clearStore()`:**
   - Se implementó un método público en `OrganizationStore` para vaciar completamente `memoryStore` y `localStorage` entre suites de prueba.
3. **Método de Reseteo `resetStorageRepository()`:**
   - Se implementó en `src/lib/storage/index.ts` para invalidar el singleton de pruebas sin afectar la lógica de producción.
4. **Ciclo de Vida de Test Runner Aislado (`src/test/run-all-tests.ts`):**
   - Se añadió `resetTestEnvironment()` antes y después de cada suite de prueba.

---

## 5. Arquitectura Antes vs Después

```text
ANTES (Contaminación de Estado):
Suite 1 (Tasks) → Escribe en memoryStore & storageRepoInstance
Suite 2 (E2E)   → Crea OrgA (Date.now() = T0) y OrgB (Date.now() = T0)
                → OrgA.id === OrgB.id (Colisión)
                → Storage getSignedUrl permite acceso porque OrgA === OrgB
                → [FAIL] Falso fallo por colisión de mock

DESPUÉS (Aislamiento Estricto):
Suite 1 (Tasks) → Finaliza
Reset Hook      → OrganizationStore.clearStore() + resetStorageRepository()
Suite 2 (E2E)   → OrgA (ID: org-T0-6kon7s9)
                → OrgB (ID: org-T0-vg6q6v1)
                → OrgA.id !== OrgB.id (100% Únicos)
                → Storage getSignedUrl deniega acceso a OrgB con "Acceso denegado"
                → [PASS] Aislamiento Verificado
```

---

## 6. Pruebas Realizadas

1. `npm run test`: Ejecución secuencial completa de las 11 suites.
2. `npx tsx src/test/run-all-tests.ts`: Ejecución directa del pipeline de tests.
3. `test_reorder.mjs`: Ejecución en orden invertido (E2E primero, luego Security, luego Tasks, luego Repos).
4. `npx tsc --noEmit`: Validación de tipos TypeScript en modo estricto.
5. `npm run build`: Compilación de producción con Vite.
6. `npm audit`: Auditoría de vulnerabilidades en dependencias.

---

## 7. Resultado Antes vs Después

| Métrica | Antes | Después |
|---|---|---|
| **npm run test** | 98/100 PASS (2 fallas) | **100/100 PASS (0 fallas)** |
| **E2E Suite en cadena** | 10 PASS / 2 FAIL | **12 PASS / 0 FAIL** |
| **E2E Suite aislada** | 12 PASS / 0 FAIL | **12 PASS / 0 FAIL** |
| **Orden Invertido** | Fallaba | **100% PASS** |
| **TypeScript (`tsc`)** | 0 errores | **0 errores** |
| **Build Vite** | Exit code 0 | **Exit code 0 (7.09s)** |
| **npm audit** | 0 vulnerabilities | **0 vulnerabilities** |

---

## 8. Validación de Aislamiento ORG_A / ORG_B

- **ORG_A puede:**
  - Crear clientes, productos, proveedores, ventas, cobros y tareas.
  - Subir documentos a su propio path `orgA.id/doc_id/file.pdf`.
  - Obtener URLs firmadas de sus propios comprobantes.
- **ORG_B NO puede:**
  - Ver clientes, productos, ventas, deudas ni cobros de ORG_A (`assert(!customersB.data.some(c => c.id === custA.id))`).
  - Obtener URLs firmadas para archivos de ORG_A (`storage.getSignedUrl(orgB.id, upDoc.storagePath)` lanza `Acceso denegado: El archivo no pertenece a su organizacion`).
  - Ver registros de auditoría de ORG_A.

---

## 9. Impacto en Producción

- **Sin degradación:** El código de producción (PostgreSQL RLS, Supabase Storage, Edge Functions) permanece **100% intacto y protegido**.
- **Mayor robustez:** `LocalRepository` ahora previene colisiones de ID incluso si dos organizaciones locales son creadas en el mismo milisegundo.

---

## 10. Riesgos Residuales

- **Ninguno.** Todas las assertions se mantuvieron intactas sin debilitar reglas de seguridad ni alterar la suite de producción.
