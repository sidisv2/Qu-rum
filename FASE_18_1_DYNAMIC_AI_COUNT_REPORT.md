# Reporte de Conteo Dinámico de Consultas Director IA (Fase 18.1)
**Direx — Enterprise Financial Intelligence & ERP**

---

## 1. Problema Resuelto
En [`src/components/subscription/SubscriptionView.tsx`](file:///c:/Users/valentin/Desktop/webb/web-main/web-main/src/components/subscription/SubscriptionView.tsx), el banner de prueba gratuita mostraba fijamente `"10 consultas de Director IA"` sin reflejar las consultas que el usuario ya había realizado.

---

## 2. Implementación Aplicada

1. **Estado de Consultas Usadas:**
   ```typescript
   const [aiQueriesUsed, setAiQueriesUsed] = useState<number>(0);
   ```

2. **Consulta Real Server-Side / Local:**
   ```typescript
   const { count: aiCount } = await supabase
     .from("ai_messages")
     .select("id", { count: "exact", head: true })
     .eq("organization_id", currentOrg.id)
     .eq("role", "user");

   if (typeof aiCount === "number") {
     setAiQueriesUsed(aiCount);
   } else {
     // Fallback a LocalStorage de la organización
     const localData = localStorage.getItem("direx_ai_chat_" + currentOrg.id);
     if (localData) {
       const parsed = JSON.parse(localData);
       const userCount = Array.isArray(parsed) ? parsed.filter((m: any) => m.sender === "user").length : 0;
       setAiQueriesUsed(userCount);
     }
   }
   ```

3. **Renderizado Dinámico en el Banner:**
   ```tsx
   <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>
     Te quedan {trialDays} días de prueba y {Math.max(0, 10 - aiQueriesUsed)} de 10 consultas de Director IA. Elegí tu plan para desbloquear acceso ilimitado y sumar a tu equipo.
   </div>
   ```

---

## 3. Verificación Técnica

- **TypeScript (`npx tsc --noEmit`):** **0 errores (PASS)**
- **Suite de Pruebas Automatizadas (`npm run test`):** **100/100 PASS (100% exitoso)**
- **Compilación de Producción (`npm run build`):** **Exit code 0 (Generado en 10.50s)**
- **Auditoría de Vulnerabilidades (`npm audit`):** **0 vulnerabilities**
