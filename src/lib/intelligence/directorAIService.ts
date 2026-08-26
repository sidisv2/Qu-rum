import { InsightEngine, EngineInput } from "./insightEngine";
import { BusinessAnalyticsResult, BusinessInsight } from "./types";
import { formatCurrency } from "../utils/formatters";

export class DirectorAIService {
  public static getAnalytics(input: EngineInput): BusinessAnalyticsResult {
    return InsightEngine.analyze(input);
  }

  public static async answerExecutiveQuery(params: {
    question: string;
    orgData: EngineInput;
    organizationName: string;
  }): Promise<{ answer: string; structuredInsights?: BusinessInsight[]; evidence?: any }> {
    const analytics = InsightEngine.analyze(params.orgData);
    const q = params.question.toLowerCase().trim();

    // 1. Pregunta: ¿Cómo está mi negocio? / Estado general
    if (q.includes("cómo está mi negocio") || q.includes("estado") || q.includes("resumen") || q.includes("situación")) {
      const netCash = analytics.salesMetrics.totalSales - analytics.expensesMetrics.totalExpenses;
      const overdueSum = analytics.receivablesMetrics.totalOverdue;
      const isPositive = netCash >= 0;

      let answer = `**Diagnóstico Ejecutivo de ${params.organizationName}:**\n\n`;
      answer += `• **Ventas Consolidadas:** ${formatCurrency(analytics.salesMetrics.totalSales)} (${analytics.salesMetrics.evolution.explanation})\n`;
      answer += `• **Gastos Operativos:** ${formatCurrency(analytics.expensesMetrics.totalExpenses)}\n`;
      answer += `• **Resultado Operativo Estimado:** ${formatCurrency(netCash)} (${isPositive ? "Superávit saludable" : "Presión sobre caja"})\n`;
      answer += `• **Cobros Vencidos:** ${formatCurrency(overdueSum)} en ${analytics.receivablesMetrics.overdueCount} cuentas en mora.\n\n`;
      
      if (analytics.insights.length > 0) {
        answer += `**Lo que requiere tu atención hoy:**\n`;
        analytics.insights.slice(0, 3).forEach((ins, idx) => {
          answer += `${idx + 1}. **${ins.title}:** ${ins.description}\n`;
        });
      }

      return {
        answer,
        structuredInsights: analytics.insights.slice(0, 3),
        evidence: analytics
      };
    }

    // 2. Pregunta: ¿Qué debería hacer hoy?
    if (q.includes("qué debería hacer") || q.includes("hoy") || q.includes("prioridad") || q.includes("hacer")) {
      if (analytics.insights.length === 0) {
        return {
          answer: `¡Todo está al día en ${params.organizationName}! No se detectan cobranzas vencidas, presupuestos por expirar ni anomalías de gastos en este momento.`
        };
      }

      let answer = `**Si hoy pudieras enfocarte en 3 prioridades clave en ${params.organizationName}:**\n\n`;
      analytics.insights.slice(0, 3).forEach((ins, idx) => {
        answer += `${idx + 1}. **${ins.title}**\n   • ${ins.description}\n   • *Acción recomendada:* ${ins.suggestedAction.label}\n\n`;
      });

      return {
        answer,
        structuredInsights: analytics.insights.slice(0, 3)
      };
    }

    // 3. Pregunta: ¿Quién me debe dinero?
    if (q.includes("debe") || q.includes("cobro") || q.includes("mora") || q.includes("deuda")) {
      if (analytics.receivablesMetrics.overdueCount === 0) {
        return {
          answer: `Tenés $0 en mora vencida. El total a cobrar corriente asciende a ${formatCurrency(analytics.receivablesMetrics.totalPending)} y se encuentra dentro de los plazos normales.`
        };
      }

      const overdueInsights = analytics.insights.filter(i => i.type === "risk" && i.relatedEntity.type === "receivable");
      return {
        answer: `Tenés **${formatCurrency(analytics.receivablesMetrics.totalOverdue)}** vencidos correspondientes a ${analytics.receivablesMetrics.overdueCount} cuentas. El promedio de mora es de ${analytics.receivablesMetrics.averageOverdueDays} días.\n\nTe sugiero priorizar el envío de recordatorios de cobro a las cuentas principales.`,
        structuredInsights: overdueInsights
      };
    }

    // 4. Pregunta: ¿Qué clientes están en riesgo?
    if (q.includes("riesgo") || q.includes("cliente")) {
      if (analytics.customersMetrics.atRiskCount === 0) {
        return {
          answer: `Tus clientes activos mantienen una regularidad de compra acorde a sus patrones históricos. No se detectan clientes en riesgo de fuga.`
        };
      }

      const clientInsights = analytics.insights.filter(i => i.relatedEntity.type === "customer");
      return {
        answer: `Detecté **${analytics.customersMetrics.atRiskCount} clientes** con inactividad superior al promedio habitual de recompra. Te recomiendo revisar sus fichas y programar un contacto de reactivación comercial.`,
        structuredInsights: clientInsights
      };
    }

    // 5. Pregunta: ¿Qué gastos aumentaron?
    if (q.includes("gasto") || q.includes("costo") || q.includes("aumento") || q.includes("egreso")) {
      if (analytics.expensesMetrics.anomalies.length === 0) {
        return {
          answer: `Los gastos operativos suman ${formatCurrency(analytics.expensesMetrics.totalExpenses)} y se mantienen estables respecto al período anterior sin anomalías detectadas.`
        };
      }

      const topAnomaly = analytics.expensesMetrics.anomalies[0];
      return {
        answer: `Los gastos totales suman **${formatCurrency(analytics.expensesMetrics.totalExpenses)}**. Se detectó un incremento del **+${topAnomaly.percentIncrease}% en ${topAnomaly.category}** (${formatCurrency(topAnomaly.current)} vs ${formatCurrency(topAnomaly.previous)} del período anterior).`,
        structuredInsights: analytics.insights.filter(i => i.type === "anomaly")
      };
    }

    // Respuesta por defecto con insights reales
    let defaultAns = `Analicé los datos de ${params.organizationName}:\n\n`;
    defaultAns += `• Ventas: ${formatCurrency(analytics.salesMetrics.totalSales)}\n`;
    defaultAns += `• Gastos: ${formatCurrency(analytics.expensesMetrics.totalExpenses)}\n`;
    defaultAns += `• Mora pendiente: ${formatCurrency(analytics.receivablesMetrics.totalOverdue)}\n\n`;
    defaultAns += `Te sugiero consultar sobre: *"¿Cómo está mi negocio?"*, *"¿Qué debería hacer hoy?"* o *"¿Quién me debe dinero?"*.`;

    return {
      answer: defaultAns,
      structuredInsights: analytics.insights.slice(0, 2)
    };
  }
}
