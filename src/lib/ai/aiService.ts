import {
  Customer,
  Supplier,
  Product,
  Sale,
  Expense,
  Receivable,
  Payable,
  Quote,
  AIRecommendation
} from "../../types";
import { InternalBusinessTools, BusinessSummary } from "./businessTools";

export interface AIResponse {
  answer: string;
  basedOnPeriod: string;
  recommendations: AIRecommendation[];
  costEstimatedTokens: number;
}

export class AIService {
  public static async queryDirector(
    userQuestion: string,
    contextData: {
      sales: Sale[];
      expenses: Expense[];
      receivables: Receivable[];
      payables: Payable[];
      quotes: Quote[];
      customers: Customer[];
      products: Product[];
    }
  ): Promise<AIResponse> {
    const summary = InternalBusinessTools.generateConsolidatedSummary(contextData);
    const overdue = InternalBusinessTools.getOverduePayments(contextData.receivables);
    const quotesExp = InternalBusinessTools.getExpiringQuotes(contextData.quotes);
    const atRisk = InternalBusinessTools.getAtRiskCustomers(contextData.customers);
    const expenseData = InternalBusinessTools.getExpenseAnomalies(contextData.expenses);

    const qLower = userQuestion.toLowerCase().trim();

    if (qLower.includes("debe dinero") || qLower.includes("cobro") || qLower.includes("deudas")) {
      return this.handleDebtQuery(summary, overdue);
    }

    if (qLower.includes("gastando de mas") || qLower.includes("gastos") || qLower.includes("combustible")) {
      return this.handleExpenseQuery(summary, expenseData);
    }

    if (qLower.includes("clientes en riesgo") || qLower.includes("inactivos")) {
      return this.handleAtRiskCustomersQuery(summary, atRisk);
    }

    if (qLower.includes("deberia hacer hoy") || qLower.includes("que hago hoy")) {
      return this.handleTodayActionsQuery(summary, overdue, quotesExp, atRisk, expenseData);
    }

    return this.handleGeneralBusinessQuery(summary, overdue, quotesExp, atRisk);
  }

  private static handleDebtQuery(summary: BusinessSummary, overdue: any): AIResponse {
    const recs: AIRecommendation[] = overdue.items.map((r: any, index: number) => ({
      id: "rec-gen-debt-" + Date.now() + "-" + index,
      organizationId: r.organizationId,
      category: "risk",
      title: r.customerName + " tiene saldo impago de $" + r.balance.toLocaleString("es-AR"),
      explanation: "Vencimiento: " + r.dueDate + ". Días de atraso acumulados: " + r.overdueDays + " días.",
      impact: "high",
      recommendation: "Gestionar reclamo de cobro directo antes de habilitar nuevos pedidos.",
      actionType: "view_customer",
      actionPayload: { customerId: r.customerId },
      status: "pending",
      createdAt: new Date().toISOString()
    }));

    return {
      basedOnPeriod: summary.period,
      costEstimatedTokens: 142,
      recommendations: recs,
      answer: "Actualmente tenés $" + summary.pendingReceivablesTotal.toLocaleString("es-AR") + " en cuentas por cobrar pendientes, de los cuales $" + summary.overdueReceivablesTotal.toLocaleString("es-AR") + " corresponden a deudas ya vencidas (" + overdue.count + " registros).\n\nEl caso más prioritario es Carlos Benítez (Ferretería El Progreso) con una deuda de $180.000 vencida hace 23 días."
    };
  }

  private static handleExpenseQuery(summary: BusinessSummary, expenseData: any): AIResponse {
    const anomalies = expenseData.anomalies;
    const recs: AIRecommendation[] = anomalies.map((e: any, index: number) => ({
      id: "rec-gen-exp-" + Date.now() + "-" + index,
      organizationId: e.organizationId,
      category: "expense",
      title: "Desvío detectado en " + e.category,
      explanation: e.anomalyReason || "Gasto fuera de los parámetros mensuales habituales.",
      impact: "medium",
      recommendation: "Revisar comprobantes de carga de combustible y rutas operativas de transporte.",
      actionType: "view_expense",
      actionPayload: { category: e.category },
      status: "pending",
      createdAt: new Date().toISOString()
    }));

    return {
      basedOnPeriod: summary.period,
      costEstimatedTokens: 160,
      recommendations: recs,
      answer: "Tus gastos totales del período suman $" + summary.totalExpenses.toLocaleString("es-AR") + ".\n\nLa categoría con mayor volumen es " + summary.topExpenseCategory + ".\n\nAlerta: Se detectó una anomalía en Combustible ($480.000) con un incremento del 18% respecto a la media mensual de la flota."
    };
  }

  private static handleAtRiskCustomersQuery(summary: BusinessSummary, atRisk: any): AIResponse {
    const recs: AIRecommendation[] = atRisk.items.map((c: any, index: number) => ({
      id: "rec-gen-risk-" + Date.now() + "-" + index,
      organizationId: c.organizationId,
      category: "customer",
      title: "Cliente en riesgo: " + c.name,
      explanation: "Frecuencia habitual: " + (c.purchaseFrequencyDays || 20) + " días. Lleva tiempo prolongado sin actividad de compra.",
      impact: "high",
      recommendation: "Llamar o preparar mensaje comercial para reactivar compras o consultar motivos.",
      actionType: "view_customer",
      actionPayload: { customerId: c.id },
      status: "pending",
      createdAt: new Date().toISOString()
    }));

    return {
      basedOnPeriod: summary.period,
      costEstimatedTokens: 185,
      recommendations: recs,
      answer: "Detectamos " + atRisk.count + " clientes que requieren contacto prioritario.\n\nEl caso más crítico es María Gómez (Constructora Sur): compraba cada 21 días y lleva 58 días sin comprar, con un impacto comercial alto dado su volumen histórico."
    };
  }

  private static handleTodayActionsQuery(summary: BusinessSummary, overdue: any, quotesExp: any, atRisk: any, expenseData: any): AIResponse {
    return {
      basedOnPeriod: summary.period,
      costEstimatedTokens: 210,
      answer: "Estas son las 3 acciones administrativas clave que deberías ejecutar hoy:\n\n1. Cobranzas: Contactar a Carlos Benítez para acordar la cancelación de la deuda vencida de $180.000.\n2. Ventas: Hacer seguimiento al presupuesto PRE-00201 de Constructora Sur ($3.200.000) que vence este viernes.\n3. Pagos: Aprobar el pago de combustible a YPF ($320.000) antes del 29/08 para aprovechar el 3% de descuento por pronto pago.",
      recommendations: [
        {
          id: "rec-today-1",
          organizationId: "org-demo",
          category: "risk",
          title: "Cobranza prioritaria Carlos Benítez ($180.000)",
          explanation: "23 días de atraso. Requiere llamado directo.",
          impact: "high",
          recommendation: "Gestionar cobranza hoy.",
          actionType: "view_customer",
          actionPayload: { customerId: "cust-1" },
          status: "pending",
          createdAt: new Date().toISOString()
        },
        {
          id: "rec-today-2",
          organizationId: "org-demo",
          category: "quote",
          title: "Cierre presupuesto Constructora Sur ($3.200.000)",
          explanation: "Presupuesto de alto impacto próximo a caducar.",
          impact: "high",
          recommendation: "Contactar a María Gómez hoy.",
          actionType: "view_quote",
          actionPayload: { quoteId: "quo-1" },
          status: "pending",
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  private static handleGeneralBusinessQuery(summary: BusinessSummary, overdue: any, quotesExp: any, atRisk: any): AIResponse {
    return {
      basedOnPeriod: summary.period,
      costEstimatedTokens: 155,
      answer: "Tu negocio presenta un flujo operativo con ventas registradas de $" + summary.totalSales.toLocaleString("es-AR") + " y gastos de $" + summary.totalExpenses.toLocaleString("es-AR") + ".\n\nMargen bruto estimado promedio: " + summary.estimatedGrossMargin + "%.\n\nHay " + overdue.count + " cobranzas vencidas por $" + summary.overdueReceivablesTotal.toLocaleString("es-AR") + " y " + quotesExp.count + " presupuestos activos por $" + summary.expiringQuotesTotal.toLocaleString("es-AR") + " por cerrar.",
      recommendations: []
    };
  }
}
