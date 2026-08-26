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
} from '../../types';

export interface BusinessSummary {
  period: string;
  totalSales: number;
  salesCount: number;
  totalExpenses: number;
  expensesCount: number;
  netCashFlow: number;
  pendingReceivablesTotal: number;
  overdueReceivablesTotal: number;
  overdueReceivablesCount: number;
  pendingPayablesTotal: number;
  expiringQuotesTotal: number;
  expiringQuotesCount: number;
  atRiskCustomersCount: number;
  topExpenseCategory: string;
  estimatedGrossMargin: number;
}

export class InternalBusinessTools {
  public static getSalesSummary(sales: Sale[]): { total: number; count: number; completedTotal: number } {
    const total = sales.reduce((acc, s) => acc + (s.status !== 'cancelled' ? s.total : 0), 0);
    const completedTotal = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.total, 0);
    return {
      total,
      count: sales.length,
      completedTotal
    };
  }

  public static getOverduePayments(receivables: Receivable[]): {
    totalOverdue: number;
    count: number;
    items: Receivable[];
  } {
    const overdue = receivables.filter(r => r.status === 'overdue' || (r.status === 'pending' && r.overdueDays > 0));
    const totalOverdue = overdue.reduce((acc, r) => acc + r.balance, 0);
    return {
      totalOverdue,
      count: overdue.length,
      items: overdue
    };
  }

  public static getExpiringQuotes(quotes: Quote[]): {
    totalExpiring: number;
    count: number;
    items: Quote[];
  } {
    const activeQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'draft');
    const totalExpiring = activeQuotes.reduce((acc, q) => acc + q.total, 0);
    return {
      totalExpiring,
      count: activeQuotes.length,
      items: activeQuotes
    };
  }

  public static getAtRiskCustomers(customers: Customer[]): {
    count: number;
    items: Customer[];
  } {
    const atRisk = customers.filter(c => c.status === 'at_risk' || c.status === 'overdue');
    return {
      count: atRisk.length,
      items: atRisk
    };
  }

  public static getExpenseAnomalies(expenses: Expense[]): {
    total: number;
    anomalies: Expense[];
    byCategory: Record<string, number>;
  } {
    const total = expenses.reduce((acc, e) => acc + e.amount, 0);
    const anomalies = expenses.filter(e => e.isAnomaly);
    const byCategory: Record<string, number> = {};

    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return {
      total,
      anomalies,
      byCategory
    };
  }

  public static generateConsolidatedSummary(data: {
    sales: Sale[];
    expenses: Expense[];
    receivables: Receivable[];
    payables: Payable[];
    quotes: Quote[];
    customers: Customer[];
    products: Product[];
  }): BusinessSummary {
    const salesSummary = this.getSalesSummary(data.sales);
    const overdue = this.getOverduePayments(data.receivables);
    const quotesExp = this.getExpiringQuotes(data.quotes);
    const customersRisk = this.getAtRiskCustomers(data.customers);
    const expenseData = this.getExpenseAnomalies(data.expenses);

    const pendingReceivablesTotal = data.receivables
      .filter(r => r.status !== 'paid')
      .reduce((acc, r) => acc + r.balance, 0);

    const pendingPayablesTotal = data.payables
      .filter(p => p.status !== 'paid')
      .reduce((acc, p) => acc + p.balance, 0);

    let topCategory = 'Sin gastos';
    let maxAmount = 0;
    Object.entries(expenseData.byCategory).forEach(([cat, amt]) => {
      if (amt > maxAmount) {
        maxAmount = amt;
        topCategory = cat;
      }
    });

    const netCashFlow = salesSummary.total - expenseData.total;
    const avgMargin = data.products.length > 0
      ? data.products.reduce((acc, p) => acc + p.marginPercent, 0) / data.products.length
      : 35;

    return {
      period: 'Mes en curso (Agosto 2026)',
      totalSales: salesSummary.total,
      salesCount: salesSummary.count,
      totalExpenses: expenseData.total,
      expensesCount: data.expenses.length,
      netCashFlow,
      pendingReceivablesTotal,
      overdueReceivablesTotal: overdue.totalOverdue,
      overdueReceivablesCount: overdue.count,
      pendingPayablesTotal,
      expiringQuotesTotal: quotesExp.totalExpiring,
      expiringQuotesCount: quotesExp.count,
      atRiskCustomersCount: customersRisk.count,
      topExpenseCategory: topCategory,
      estimatedGrossMargin: Math.round(avgMargin * 10) / 10
    };
  }
}
