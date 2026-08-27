# REPORTE DE RECORDATORIOS INTELIGENTES DE COBRO — FASE 7C (DIREX)

**Fecha:** 27 de Agosto, 2026  
**Proyecto:** DIREX — SaaS B2B "Director Administrativo IA para PyMEs"  

---

## 1. Alcance y Filosofía Regulatoria
- **Zero Payment Processing:** Este módulo **NO** procesa cobros ni se integra con pasarelas de pago, manteniéndose fuera de regulaciones financieras complejas.
- **Asistente de Redacción y Priorización:** Calcula la mora y sugiere un mensaje profesional para que el usuario lo revise y copie con un clic.

---

## 2. Flujo de Trabajo en `SmartCollectionsView.tsx`
1. **Detección Automática de Mora:**
   - 🟢 Al día / Próximo a vencer.
   - 🟡 Atraso Leve (1 a 15 días).
   - 🔴 Mora Crítica (+15 días).
2. **Priorización por Impacto Financiero:**
   - Algoritmo de ranking: `Saldo adeudado × (Días de atraso + 1)`.
3. **Generación de Mensaje por el Director IA:**
   - Textos adaptados al nivel de mora (cordial para atraso leve, formal y urgente para mora crítica).
   - Botón directo *"Copiar mensaje"* con feedback visual de copiado al portapapeles.

---

## 3. Dictamen
🟢 **RECORDATORIOS INTELIGENTES ACTIVOS Y OPERATIVOS**
