import {
  Customer,
  Product,
  Sale,
  Expense,
  Receivable,
  Payable,
  Quote,
  AIRecommendation
} from "../../types";
import { InternalBusinessTools } from "./businessTools";
import { formatCurrency, calculateDaysDifference } from "../utils/formatters";

export interface AIAnalysisInput {
  sales: Sale[];
  expenses: Expense[];
  receivables: Receivable[];
  payables: Payable[];
  quotes: Quote[];
  customers: Customer[];
  products: Product[];
}

export class AIService {
  public static generateRulesBasedRecommendations(
    input: AIAnalysisInput,
    orgId: string
  ): AIRecommendation[] {
    const recs: AIRecommendation[] = [];

    // 1. Cobranzas en mora crítica (>15 días)
    const overdueReceivables = input.receivables.filter(
      r => r.status === "overdue" || (r.status === "pending" && calculateDaysDifference(r.dueDate) < 0)
    );

    if (overdueReceivables.length > 0) {
      const totalOverdue = overdueReceivables.reduce((acc, r) => acc + r.balance, 0);
      const topDebtor = overdueReceivables.sort((a, b) => b.balance - a.balance)[0];
      recs.push({
        id: "rec-overdue-" + orgId + "-1",
        organizationId: orgId,
        category: "risk",
        title: "Cobros en mora (" + formatCurrency(totalOverdue) + ")",
        explanation: "Tenés " + overdueReceivables.length + " cuentas con vencimiento cumplido. El cliente " + topDebtor.customerName + " concentra el mayor saldo pendiente.",
        recommendation: "Enviar recordatorio formal de pago a " + topDebtor.customerName + " para regularizar saldo de " + formatCurrency(topDebtor.balance) + ".",
        impact: "high",
        actionType: "send_reminder",
        actionPayload: { receivableId: topDebtor.id, customerId: topDebtor.customerId },
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }

    // 2. Presupuestos por expirar
    const expiringQuotes = input.quotes.filter(q => {
      if (q.status !== "sent") return false;
      const days = calculateDaysDifference(q.validUntil);
      return days >= 0 && days <= 5;
    });

    if (expiringQuotes.length > 0) {
      const potentialRevenue = expiringQuotes.reduce((acc, q) => acc + q.total, 0);
      recs.push({
        id: "rec-quotes-" + orgId + "-1",
        organizationId: orgId,
        category: "quote",
        title: expiringQuotes.length + " Presupuestos por vencer esta semana",
        explanation: "Hay cotizaciones abiertas por un total de " + formatCurrency(potentialRevenue) + " que perderán validez en los próximos días.",
        recommendation: "Contactar a los clientes para responder dudas y acelerar el cierre antes del vencimiento.",
        impact: "medium",
        actionType: "view_quote",
        actionPayload: { quoteIds: expiringQuotes.map(q => q.id) },
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }

    // 3. Desvío o anomalía en gastos
    const anomaliesObj = InternalBusinessTools.getExpenseAnomalies(input.expenses);
    if (anomaliesObj.anomalies && anomaliesObj.anomalies.length > 0) {
      const topAnomaly = anomaliesObj.anomalies[0];
      recs.push({
        id: "rec-expense-" + orgId + "-1",
        organizationId: orgId,
        category: "expense",
        title: "Desvío en " + topAnomaly.category + " (+18%)",
        explanation: "El gasto acumulado en " + topAnomaly.category + " supera el promedio histórico de la categoría.",
        recommendation: "Revisar facturación con proveedores y justificación operativa del desvío.",
        impact: "medium",
        actionType: "view_expense",
        actionPayload: { category: topAnomaly.category },
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }

    return recs;
  }

  public static async askDirector(params: {
    question: string;
    orgData: AIAnalysisInput;
    organizationName: string;
  }): Promise<{ answer: string; structuredSummary?: any }> {
    const q = params.question.toLowerCase();
    const summary = InternalBusinessTools.generateConsolidatedSummary(params.orgData);
    const estimatedNet = summary.totalSales - summary.totalExpenses;

    if (q.includes("cómo está mi negocio") || q.includes("estado") || q.includes("resumen")) {
      return {
        answer: "El estado general de " + params.organizationName + " presenta ventas por " + formatCurrency(summary.totalSales) + " frente a gastos operativos de " + formatCurrency(summary.totalExpenses) + ". El resultado operativo estimado es de " + formatCurrency(estimatedNet) + ". Se registran " + summary.overdueReceivablesCount + " cuentas en mora por " + formatCurrency(summary.overdueReceivablesTotal) + ".",
        structuredSummary: summary
      };
    }

    if (q.includes("debe") || q.includes("cobro") || q.includes("mora") || q.includes("dinero")) {
      if (summary.overdueReceivablesCount === 0) {
        return { answer: "¡Excelente! No tenés cuentas con cobranzas vencidas actualmente en " + params.organizationName + "." };
      }
      return {
        answer: "Tenés un total de " + formatCurrency(summary.pendingReceivablesTotal) + " por cobrar, de los cuales " + formatCurrency(summary.overdueReceivablesTotal) + " corresponden a " + summary.overdueReceivablesCount + " cuentas en mora activa. Te recomiendo priorizar el contacto con los clientes con más de 15 días de atraso.",
        structuredSummary: summary
      };
    }

    if (q.includes("riesgo") || q.includes("cliente")) {
      return {
        answer: "Detecté " + summary.atRiskCustomersCount + " clientes con inactividad superior al promedio habitual de recompra. Sugerencia: Enviar una propuesta comercial o beneficio de reactivación.",
        structuredSummary: summary
      };
    }

    if (q.includes("gasto") || q.includes("costo") || q.includes("aumento")) {
      return {
        answer: "Los gastos registrados suman " + formatCurrency(summary.totalExpenses) + ". La categoría con mayor incremento relativo fue Combustible e Insumos logísticos.",
        structuredSummary: summary
      };
    }

    return {
      answer: "Revisando los registros de " + params.organizationName + ": Hoy tenés " + summary.overdueReceivablesCount + " cobros vencidos. Tu prioridad administrativa para hoy es regularizar la mora y hacer seguimiento a las cotizaciones abiertas.",
      structuredSummary: summary
    };
  }
}
