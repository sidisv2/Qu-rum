# CATÁLOGO DE REGLAS E INSIGHTS — DIREX

| ID | Tipo | Severidad | Regla Determinística | Impacto Cuantificado | Evidencia | Acción Sugerida |
|---|---|---|---|---|---|---|
| `ins-mora` | `risk` | **Critical** | `fecha_vencimiento < hoy && saldo > 0` | Saldo total en mora ($) | Fecha de vencimiento, cliente principal, días de atraso. | Recordatorio formal de cobro. |
| `ins-quotes` | `opportunity` | **High** | `estado == "sent" && dias_vencimiento <= 5` | Suma de presupuestos abiertos ($) | Número de cotización, cliente, fecha de expiración. | Contacto comercial para acelerar el cierre. |
| `ins-risk-cust` | `risk` | **Medium** | `dias_sin_compra > (frecuencia_habitual * 1.5)` | Facturación histórica del cliente ($) | Días transcurridos, promedio histórico, compras previas. | Contacto de reactivación. |
| `ins-exp-anomaly` | `anomaly` | **Medium** | `gasto_categoria > (promedio_anterior * 1.15)` | Diferencia absoluta ($ y %) | Gasto actual, gasto anterior, % de incremento. | Auditoría de comprobantes. |
| `ins-prod-margin` | `alert` | **Low** | `margen_porcentaje < 20%` | Margen unitario ($ y %) | Precio de venta, costo registrado, % margen bruto. | Revisión de lista de precios. |
