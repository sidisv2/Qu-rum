# ARQUITECTURA DE INTELIGENCIA Y DIRECTOR IA — DIREX (FASE 3)

## 1. Principio Fundamental
> **"Primero calculamos hechos con código; después la IA interpreta esos hechos."**
> (`Datos → Métricas → Reglas Analíticas → Insights → Priorización → IA → Recomendación → Acción`)

Direx no delega el cálculo matemático ni el descubrimiento de datos a la imaginación del LLM. Todas las métricas, diferencias porcentuales, días de mora y márgenes son calculados de forma determinística por el **`InsightEngine`**.

---

## 2. Componentes de la Capa de Inteligencia

```
src/lib/intelligence/
├── types.ts                # Modelos de Insight, Evidencia, Evolución y Analítica
├── insightEngine.ts        # Motor determinístico de métricas, anomalías y scoring
└── directorAIService.ts    # Capa ejecutiva de respuesta estructurada y contextualización
```

---

## 3. Modelo de Insight Estructurado
Cada situación detectada por el motor contiene:
- **`id` & `organizationId`:** Aislamiento estricto multi-tenant.
- **`type`:** `risk` (Riesgo), `opportunity` (Oportunidad), `anomaly` (Anomalía), `alert` (Alerta).
- **`severity`:** `critical`, `high`, `medium`, `low`.
- **`score`:** Puntaje numérico del 1 al 100 para ordenamiento objetivo de prioridades.
- **`impactFormatted`:** Cuantificación económica real (`$180.000`, `+18%`).
- **`confidence`:** Nivel de confianza (`high`, `medium`, `low`) basado en volumen de transacciones.
- **`evidence`:** Lista de pruebas objetivas (`origen`, `monto`, `días`).
- **`suggestedAction`:** Acción de un click para mitigar el riesgo o capitalizar la oportunidad.

---

## 4. Consumo Unificado (Sin Duplicación de Lógica)
Toda la aplicación consume la misma fuente analítica:
- **Dashboard:** Consume `analytics.insights` en "Requiere Atención" con botón para abrir drawer de evidencia (*"Ver datos utilizados"*).
- **Mi Día:** Consume `analytics.insights` priorizados por score para ordenar la jornada del dueño de la PyME.
- **Director IA:** Consulta `DirectorAIService.answerExecutiveQuery` para generar diagnósticos ejecutivos con cero alucinaciones.

---

## 5. Garantías de Privacidad y Fallback
- **Aislamiento Multi-Tenant:** Ninguna consulta o insight cruza datos entre organizaciones distintas (`Org A ≠ Org B`).
- **Resiliencia / Fallback:** Si no hay conexión o falla el modelo, el motor analítico sigue entregando todos los diagnósticos numéricos y alertas determinísticas sin interrupciones.
