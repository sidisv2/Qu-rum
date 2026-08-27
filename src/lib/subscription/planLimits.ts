export interface PlanDefinition {
  id: "starter" | "founder" | "pro";
  name: string;
  maxUsers: number;
  aiMonthlyQuota: number | "unlimited";
  features: string[];
}

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Plan Starter",
    maxUsers: 2,
    aiMonthlyQuota: 50,
    features: [
      "Director IA estándar (50 consultas/mes)",
      "Ventas, Gastos y Cobranzas",
      "Hasta 2 usuarios",
      "Importación CSV"
    ]
  },
  founder: {
    id: "founder",
    name: "Plan Fundador",
    maxUsers: 5,
    aiMonthlyQuota: "unlimited",
    features: [
      "Director IA ilimitado",
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
    aiMonthlyQuota: "unlimited",
    features: [
      "Director IA ilimitado",
      "Multi-empresa y Multi-moneda",
      "Hasta 10 usuarios",
      "Auditoría append-only avanzada",
      "SLA 99.9%"
    ]
  }
};

export class PlanLimitsService {
  public static getPlan(planId: string = "founder"): PlanDefinition {
    return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.founder;
  }

  public static canAddMember(currentMembersCount: number, planId: string = "founder", status: string = "trialing"): {
    allowed: boolean;
    maxAllowed: number;
    reason?: string;
  } {
    // Durante período de prueba (trialing), se otorgan cuotas de Fundador (hasta 5 miembros)
    const effectivePlanId = status === "trialing" ? "founder" : planId;
    const plan = this.getPlan(effectivePlanId);
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
    currentMonthQueriesCount: number,
    planId: string = "founder",
    status: string = "trialing"
  ): {
    allowed: boolean;
    quota: number | "unlimited";
    reason?: string;
  } {
    if (status === "trialing") {
      return { allowed: true, quota: "unlimited" };
    }

    const plan = this.getPlan(planId);
    if (plan.aiMonthlyQuota === "unlimited") {
      return { allowed: true, quota: "unlimited" };
    }

    if (currentMonthQueriesCount >= plan.aiMonthlyQuota) {
      return {
        allowed: false,
        quota: plan.aiMonthlyQuota,
        reason: `Alcanzaste tu límite mensual de ${plan.aiMonthlyQuota} consultas con el Director IA en el ${plan.name}. Actualizá tu plan a Fundador o Pro para acceso ilimitado.`
      };
    }

    return {
      allowed: true,
      quota: plan.aiMonthlyQuota
    };
  }
}
