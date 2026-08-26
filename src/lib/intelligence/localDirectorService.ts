import { DirectorRequest, DirectorResponse } from "./directorContract";
import { InsightEngine, EngineInput } from "./insightEngine";
import { formatCurrency } from "../utils/formatters";

export class LocalDirectorService {
  public static async askLocalDirector(
    request: DirectorRequest,
    orgData: EngineInput,
    orgName: string
  ): Promise<DirectorResponse> {
    const analytics = InsightEngine.analyze(orgData);
    const q = request.question.toLowerCase().trim();

    // 1. Pregunta: ¿Cómo está mi negocio? / Estado general
    if (q.includes("cómo está mi negocio") || q.includes("estado") || q.includes("resumen") || q.includes("situación") || q.includes("hoy")) {
      const netCash = analytics.salesMetrics.totalSales - analytics.expensesMetrics.totalExpenses;
      const overdueSum = analytics.receivablesMetrics.totalOverdue;
      const isPositive = netCash >= 0;

      let answer = `**Diagnóstico Ejecutivo de ${orgName}:**\n\n`;
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
        requestId: "req-local-" + Date.now(),
        organizationId: request.organizationId || "org-local",
        type: "diagnostic",
        answer,
        structuredInsights: analytics.insights.slice(0, 3),
        actions: analytics.insights
          .filter(i => i.suggestedAction)
          .map((i, idx) => ({
            id: "act-" + idx,
            type: "create_task",
            label: i.suggestedAction.label,
            description: i.description,
            payload: {
              taskTitle: i.title,
              taskDescription: i.description,
              taskPriority: (i.severity as string) === "danger" || (i.severity as string) === "critical" ? "urgent" : i.severity === "high" ? "high" : "medium",
              entityType: i.relatedEntity?.type as any,
              entityId: i.relatedEntity?.id
            },
            requiresConfirmation: true
          })),
        timestamp: new Date().toISOString()
      };
    }

    let defaultAns = `Analicé los datos de ${orgName}:\n\n`;
    defaultAns += `• Ventas: ${formatCurrency(analytics.salesMetrics.totalSales)}\n`;
    defaultAns += `• Gastos: ${formatCurrency(analytics.expensesMetrics.totalExpenses)}\n`;
    defaultAns += `• Mora pendiente: ${formatCurrency(analytics.receivablesMetrics.totalOverdue)}\n\n`;

    return {
      requestId: "req-local-" + Date.now(),
      organizationId: request.organizationId || "org-local",
      type: "answer",
      answer: defaultAns,
      structuredInsights: analytics.insights.slice(0, 2),
      actions: [],
      timestamp: new Date().toISOString()
    };
  }
}
