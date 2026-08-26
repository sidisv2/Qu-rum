export type InsightType = "risk" | "alert" | "opportunity" | "trend" | "anomaly" | "info";
export type InsightSeverity = "critical" | "high" | "medium" | "low" | "info";
export type InsightConfidence = "high" | "medium" | "low";

export interface InsightEvidence {
  label: string;
  value: string | number;
  comparison?: string;
  source: string;
}

export interface BusinessInsight {
  id: string;
  organizationId: string;
  type: InsightType;
  severity: InsightSeverity;
  score: number; // 1 to 100 for deterministic priority ranking
  title: string;
  description: string;
  impactFormatted: string;
  impactNumeric: number;
  confidence: InsightConfidence;
  evidence: InsightEvidence[];
  relatedEntity: {
    type: "customer" | "quote" | "expense" | "product" | "receivable" | "sale";
    id: string;
    name: string;
  };
  suggestedAction: {
    label: string;
    actionType: "create_task" | "view_customer" | "view_quote" | "view_expense" | "send_reminder";
    payload: Record<string, any>;
  };
  status: "pending" | "applied" | "dismissed";
  createdAt: string;
}

export interface MetricEvolution {
  current: number;
  previous: number;
  difference: number;
  percentChange: number;
  hasEnoughData: boolean;
  explanation: string;
}

export interface BusinessAnalyticsResult {
  salesMetrics: {
    totalSales: number;
    salesCount: number;
    averageTicket: number;
    evolution: MetricEvolution;
  };
  expensesMetrics: {
    totalExpenses: number;
    expensesCount: number;
    byCategory: Record<string, number>;
    anomalies: Array<{ category: string; current: number; previous: number; percentIncrease: number }>;
  };
  receivablesMetrics: {
    totalPending: number;
    totalOverdue: number;
    overduePercent: number;
    averageOverdueDays: number;
    overdueCount: number;
  };
  customersMetrics: {
    totalActive: number;
    atRiskCount: number;
    repurchaseOpportunitiesCount: number;
  };
  productsMetrics: {
    totalProducts: number;
    lowMarginCount: number;
    negativeMarginCount: number;
    averageMarginPercent: number;
  };
  quotesMetrics: {
    totalQuotes: number;
    activeQuotesTotal: number;
    expiringSoonCount: number;
    conversionRate: number;
  };
  insights: BusinessInsight[];
}
