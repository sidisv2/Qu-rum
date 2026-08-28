export interface PlanDefinition {
  id: "starter" | "founder" | "pro";
  name: string;
  maxUsers: number;
  aiMonthlyQuota: number;
  features: string[];
}

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Plan Starter",
    maxUsers: 2,
    aiMonthlyQuota: 75,
    features: [
      "Director IA (75 consultas/mes)",
      "Ventas, Gastos y Cobranzas",
      "Hasta 2 usuarios incluidos",
      "Importación CSV"
    ]
  },
  founder: {
    id: "founder",
    name: "Plan Fundador",
    maxUsers: 5,
    aiMonthlyQuota: 200,
    features: [
      "Director IA prioritario (200 consultas/mes)",
      "Gestión de Cobros Inteligente",
      "Hasta 5 usuarios incluidos",
      "Precio congelado por 12 meses",
      "Soporte prioritario 1 a 1"
    ]
  },
  pro: {
    id: "pro",
    name: "Plan Pro",
    maxUsers: 10,
    aiMonthlyQuota: 500,
    features: [
      "Director IA corporativo (500 consultas/mes)",
      "Multi-empresa y Multi-moneda",
      "Hasta 10 usuarios incluidos",
      "Auditoría append-only avanzada",
      "SLA 99.9% y soporte dedicado"
    ]
  }
};

export class PlanLimitsService {
  public static readonly TRIAL_DAYS = 7;
  public static readonly TRIAL_AI_QUOTA = 10;
  public static readonly TRIAL_MAX_USERS = 1;
  public static readonly TRIAL_MAX_TRANSACTIONS = 15;

  public static getPlan(planId: string = "founder"): PlanDefinition {
    return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.founder;
  }

  public static getTrialDaysRemaining(createdAt?: string | null): number {
    if (!createdAt) return this.TRIAL_DAYS;
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return Math.max(0, this.TRIAL_DAYS - diffDays);
  }

  public static canAddMember(
    currentMembersCount: number,
    planId: string = "founder",
    status: string = "trialing"
  ): {
    allowed: boolean;
    maxAllowed: number;
    reason?: string;
  } {
    if (status === "trialing") {
      const maxAllowed = this.TRIAL_MAX_USERS;
      if (currentMembersCount >= maxAllowed) {
        return {
          allowed: false,
          maxAllowed,
          reason: "El período de prueba permite 1 solo usuario. Suscribite al Plan Fundador para sumar hasta 5 colaboradores."
        };
      }
      return { allowed: true, maxAllowed };
    }

    const plan = this.getPlan(planId);
    const maxAllowed = plan.maxUsers;

    if (currentMembersCount >= maxAllowed) {
      return {
        allowed: false,
        maxAllowed,
        reason: `Límite de usuarios alcanzado (${currentMembersCount}/${maxAllowed}) para tu ${plan.name}. Mejorá a un plan superior.`
      };
    }

    return {
      allowed: true,
      maxAllowed
    };
  }

  public static canQueryAI(
    currentQueriesCount: number,
    planId: string = "founder",
    status: string = "trialing",
    orgCreatedAt?: string | null
  ): {
    allowed: boolean;
    quota: number;
    remaining: number;
    reason?: string;
  } {
    if (status === "trialing") {
      const daysRemaining = this.getTrialDaysRemaining(orgCreatedAt);
      if (daysRemaining <= 0) {
        return {
          allowed: false,
          quota: this.TRIAL_AI_QUOTA,
          remaining: 0,
          reason: "Tu período de prueba de 7 días ha finalizado. Elegí un plan para continuar consultando al Director IA."
        };
      }

      const quota = this.TRIAL_AI_QUOTA;
      const remaining = Math.max(0, quota - currentQueriesCount);

      if (currentQueriesCount >= quota) {
        return {
          allowed: false,
          quota,
          remaining: 0,
          reason: `Alcanzaste el límite de ${quota} consultas de prueba con el Director IA. Elegí tu plan para aumentar tu cuota mensual.`
        };
      }

      return {
        allowed: true,
        quota,
        remaining
      };
    }

    const plan = this.getPlan(planId);
    const quota = plan.aiMonthlyQuota;
    const remaining = Math.max(0, quota - currentQueriesCount);

    if (currentQueriesCount >= quota) {
      return {
        allowed: false,
        quota,
        remaining: 0,
        reason: `Alcanzaste tu límite mensual de ${quota} consultas con el Director IA en el ${plan.name}. Actualizá tu plan para ampliar tu cuota.`
      };
    }

    return {
      allowed: true,
      quota,
      remaining
    };
  }
}
