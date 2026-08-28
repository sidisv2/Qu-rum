# Protocolo de Diagnóstico y Auto-Resolución de Bugs
**Direx Enterprise Intelligence Platform**

Este documento establece las directivas técnicas obligatorias que rigen el comportamiento de agentes de IA, desarrolladores y herramientas automatizadas que operan en este repositorio.

---

## 1. Regla de Oro: Diagnóstico de Causa Raíz
1. **Inspección de Traza Real:**
   - Ante cualquier error de backend o base de datos (PostgreSQL / Supabase), está estrictamente prohibido asumir o parchar el síntoma superficialmente sin inspeccionar el mensaje de error completo y la traza de la API / RPC.
   - En PostgreSQL, los tipos de datos como `UUID`, `NUMERIC` o `TIMESTAMPTZ` deben ser respetados estrictamente (ej. usar `null` para relaciones foráneas opcionales, nunca strings sintéticos como `"cust-imported"`).

2. **Prohibición de "Swallow" de Errores:**
   - Queda terminantemente prohibido silenciar excepciones (`catch {}` sin logging o sin propagar el error al usuario/audit trail).
   - Todo error en mutaciones financieras debe reflejarse en la UI con un mensaje comprensible y registrarse en el log de auditoría.

---

## 2. Protocolo Obligatorio de Verificación

En cada fase o cambio de código, antes de proponer cualquier commit, es **mandatorio** ejecutar la pipeline de 4 pasos sin omitir ninguno:

```bash
# 1. Chequeo estático de tipos sin emitir bundle
npx tsc --noEmit

# 2. Ejecución completa de suites de pruebas automatizadas
npm run test

# 3. Compilación de producción (Vite + Rollup)
npm run build

# 4. Auditoría de seguridad de paquetes
npm audit
```

- **Criterio de Aceptación:**
  - `0` errores de TypeScript.
  - `100%` de pruebas en estado `PASS`.
  - `Exit code 0` en el comando `npm run build`.
  - `0` vulnerabilidades críticas en dependencias.

---

## 3. Directiva de Publicación y Git Workflow

1. **Autorización Explícita:**
   - Ningún agente puede ejecutar `git commit` ni `git push origin main` sin la autorización expresa del usuario supervisor en el chat.
2. **Reportes de Fase:**
   - Cada fase debe concluir con la creación de su reporte en formato Markdown (`FASE_XX_..._REPORT.md`), detallando la causa raíz, la solución implementada y los resultados de validación.
