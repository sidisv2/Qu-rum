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
      "Multi-empresa y Multi-caja",
      "Hasta 10 usuarios incluidos",
      "Integración API Bancaria",
      "Asesor Financiero Dedicado"
    ]
  }
};

export class PlanLimitsService {
  public static readonly TRIAL_AI_QUOTA = 10;
  public static readonly TRIAL_DAYS = 7;
  public static readonly TOTAL_FOUNDER_SLOTS = 10;

  public static getPlan(planId: string): PlanDefinition {
    return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.starter;
  }

  public static getTrialDaysRemaining(orgCreatedAt?: string | null): number {
    if (!orgCreatedAt) return this.TRIAL_DAYS;
    try {
      const created = new Date(orgCreatedAt);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, this.TRIAL_DAYS - diffDays);
    } catch {
      return this.TRIAL_DAYS;
    }
  }

  public static canQueryAI(
    currentQueriesCount: number,
    planId: string = "starter",
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
          reason: "Alcanzaste el límite de 10 consultas de prueba con el Director IA. Elegí tu plan para aumentar tu cuota mensual o solicitá a un admin restablecer las consultas de evaluación."
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
        reason: "Has alcanzado el límite mensual de " + quota + " consultas incluido en tu " + plan.name + ". Podés mejorar tu plan o esperar la renovación del ciclo."
      };
    }

    return {
      allowed: true,
      quota,
      remaining
    };
  }

  public static canAddMember(currentMembersCount: number, planId: string, _subStatus?: string): { allowed: boolean; maxAllowed: number; reason?: string } {
    return this.canAddUser(currentMembersCount, planId, _subStatus);
  }

  public static canAddUser(currentUsersCount: number, planId: string, _subStatus?: string): { allowed: boolean; maxAllowed: number; reason?: string } {
    const plan = this.getPlan(planId);
    const maxAllowed = plan.maxUsers;

    if (currentUsersCount >= maxAllowed) {
      return {
        allowed: false,
        maxAllowed,
        reason: "Tu plan actual (" + plan.name + ") permite hasta " + maxAllowed + " usuarios. Para invitar a más miembros, mejorá al Plan Fundador o Pro."
      };
    }

    return {
      allowed: true,
      maxAllowed
    };
  }
}
