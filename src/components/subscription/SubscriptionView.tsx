import React, { useState, useEffect } from "react";
import { CreditCard, Check, Sparkles, Clock, AlertCircle, ExternalLink, Loader2, Lock, ArrowUpRight } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { PlanLimitsService } from "../../lib/subscription/planLimits";
import { supabase } from "../../lib/supabase/client";
import { Button } from "../ui/Button";

interface Plan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  features: string[];
  isFounder?: boolean;
}

interface CurrentSubscription {
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "none";
  isFounderPrice: boolean;
  currentPeriodEnd?: string | null;
}

export const SubscriptionView: React.FC = () => {
  const { currentOrg } = useOrg();
  const MARKETING_FOUNDER_OFFSET = 5; // Base fija de 5 cupos tomados
  const TOTAL_FOUNDER_SLOTS = 10;
  const [realFounderCount, setRealFounderCount] = useState<number>(0);
  const [aiQueriesUsed, setAiQueriesUsed] = useState<number>(0);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription>({
    planId: "founder",
    status: "trialing",
    isFounderPrice: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [_isInitializing, setIsInitializing] = useState(true);

  const plans: Plan[] = [
    {
      id: "founder",
      name: "Plan Fundador",
      price: 9900,
      maxUsers: 5,
      isFounder: true,
      features: [
        "Director IA prioritario (200 consultas/mes)",
        "Gestión de Cobros Inteligente",
        "Hasta 5 usuarios incluidos",
        "Precio congelado por 12 meses",
        "Soporte prioritario 1 a 1"
      ]
    },
    {
      id: "starter",
      name: "Plan Starter",
      price: 19900,
      maxUsers: 2,
      features: [
        "Director IA estándar (75 consultas/mes)",
        "Ventas, Gastos y Cobranzas",
        "Hasta 2 usuarios incluidos",
        "Importador universal CSV"
      ]
    },
    {
      id: "pro",
      name: "Plan Pro",
      price: 44900,
      maxUsers: 10,
      features: [
        "Director IA corporativo (500 consultas/mes)",
        "Multi-empresa y Multi-moneda",
        "Hasta 10 usuarios incluidos",
        "Auditoría append-only avanzada",
        "SLA 99.9% y soporte prioritario"
      ]
    }
  ];

  useEffect(() => {
    async function loadSubscriptionData() {
      if (!currentOrg?.id) {
        setIsInitializing(false);
        return;
      }
      setIsInitializing(true);
      try {
        if (supabase) {
          // 1. Consultar cupos de Fundador
          try {
            const { data: slots, error: slotsErr } = await supabase.rpc("get_founder_slots_count");
            if (!slotsErr && typeof slots === "number") {
              setRealFounderCount(slots);
            } else {
              setRealFounderCount(0);
            }
          } catch (_rpcErr) {
            setRealFounderCount(0);
          }

          // 1.1 Consultar mensajes reales del Director IA para calcular consultas usadas
          try {
            const { count: aiCount } = await supabase
              .from("ai_messages")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", currentOrg.id)
              .eq("role", "user");

            if (typeof aiCount === "number") {
              setAiQueriesUsed(aiCount);
            } else {
              // Fallback de localStorage
              const localData = localStorage.getItem("direx_ai_chat_" + currentOrg.id);
              if (localData) {
                const parsed = JSON.parse(localData);
                const userCount = Array.isArray(parsed) ? parsed.filter((m: any) => m.sender === "user").length : 0;
                setAiQueriesUsed(userCount);
              }
            }
          } catch (_aiErr) {
            try {
              const localData = localStorage.getItem("direx_ai_chat_" + currentOrg.id);
              if (localData) {
                const parsed = JSON.parse(localData);
                const userCount = Array.isArray(parsed) ? parsed.filter((m: any) => m.sender === "user").length : 0;
                setAiQueriesUsed(userCount);
              }
            } catch {}
          }

          // 2. Consultar suscripción actual
          try {
            const { data: subData, error: subErr } = await supabase
              .from("organization_subscriptions")
              .select("plan_id, status, is_founder_price, current_period_end")
              .eq("organization_id", currentOrg.id)
              .maybeSingle();

            if (!subErr && subData) {
              setCurrentSub({
                planId: subData.plan_id,
                status: subData.status as any,
                isFounderPrice: subData.is_founder_price,
                currentPeriodEnd: subData.current_period_end
              });
            }
          } catch (_subQueryErr) {
            // Mantener estado seguro por defecto
          }
        }
      } catch (_e) {
        // Fallback controlado
      } finally {
        setIsInitializing(false);
      }
    }

    loadSubscriptionData();
  }, [currentOrg?.id]);

  const handleSubscribe = async (planId: string) => {
    if (!currentOrg?.id) {
      setActionError("Primero debés seleccionar o crear una empresa");
      return;
    }
    setIsLoading(true);
    setActionError(null);

    try {
      if (supabase) {
        const { data, error } = await supabase.functions.invoke("create-subscription", {
          body: {
            organizationId: currentOrg.id,
            planId,
            backUrl: window.location.href
          }
        });

        if (error) {
          // Si el servidor devolvió un error legible
          const message = error.context?.json?.error || error.message || "Error al conectar con el servidor de suscripciones";
          setActionError(message);
          return;
        }

        if (data?.error) {
          setActionError(data.error);
          return;
        }

        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      // Fallback sandbox
      window.location.href = `https://www.mercadopago.com.ar/subscriptions/checkout?pref_id=sandbox-${planId}-${currentOrg.id}`;
    } catch (err: any) {
      setActionError(err.message || "Error al conectar con la pasarela de pagos");
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveTaken = MARKETING_FOUNDER_OFFSET + realFounderCount;
  const slotsRemaining = Math.max(0, TOTAL_FOUNDER_SLOTS - effectiveTaken);
  const isFounderAvailable = slotsRemaining > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CreditCard size={22} style={{ color: "var(--color-primary, #4f46e5)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Mi Plan y Suscripción
          </h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Gestión de planes de suscripción mensual procesados de forma segura mediante Mercado Pago.
        </p>
      </div>

      {actionError && (
        <div className="card" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Estado Actual del Tenant */}
      {(() => {
        const isTrial = currentSub.status === "trialing" || currentSub.status === "none";
        const trialDays = PlanLimitsService.getTrialDaysRemaining(currentOrg?.createdAt);
        const isExpired = isTrial && trialDays <= 0;

        if (currentSub.status === "active") {
          return (
            <div className="card" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Sparkles size={24} style={{ color: "#16a34a" }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "#166534" }}>
                    Estado: Suscripción Activa ({currentSub.planId.toUpperCase()})
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>
                    Tu empresa cuenta con {PlanLimitsService.getPlan(currentSub.planId).aiMonthlyQuota} consultas mensuales de Director IA y cobros inteligentes.
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "9999px", backgroundColor: "#dcfce7", color: "#166534", textTransform: "uppercase" }}>
                ACTIVO
              </span>
            </div>
          );
        }

        if (isExpired) {
          return (
            <div className="card" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <AlertCircle size={24} style={{ color: "#dc2626" }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "#991b1b" }}>
                    Estado: Período de Prueba Expirado (EXPIRED)
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#b91c1c" }}>
                    Tu período de prueba de 7 días ha finalizado. Elegí un plan para reactivar tu Director IA y sumar a tu equipo.
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "9999px", backgroundColor: "#fee2e2", color: "#991b1b", textTransform: "uppercase" }}>
                EXPIRADO
              </span>
            </div>
          );
        }

        return (
          <div className="card" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Clock size={24} style={{ color: "#16a34a" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#166534" }}>
                  Estado: Plan de Prueba (Free)
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>
                  Te quedan {trialDays} días de prueba y {Math.max(0, 10 - aiQueriesUsed)} de 10 consultas de Director IA. Elegí tu plan para desbloquear acceso ilimitado y sumar a tu equipo.
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "9999px", backgroundColor: "#dcfce7", color: "#166534", textTransform: "uppercase" }}>
              TRIAL ({trialDays} DÍAS)
            </span>
          </div>
        );
      })()}

      {/* Cupos de Fundador */}
      {isFounderAvailable && (
        <div className="card" style={{ backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b21a8" }}>
              <Clock size={18} />
              <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                Cupo Exclusivo de Fundadores: Quedan {slotsRemaining} de {TOTAL_FOUNDER_SLOTS} lugares
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7e22ce" }}>
              $9.900/mes x 12 meses
            </span>
          </div>
        </div>
      )}

      {/* Tarjetas de Planes (Oculta Plan Fundador si no hay cupos disponibles) */}
      <div style={{ display: "grid", gridTemplateColumns: isFounderAvailable ? "repeat(auto-fit, minmax(280px, 1fr))" : "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {plans
          .filter(plan => plan.id !== "founder" || isFounderAvailable)
          .map(plan => {
            const isAvailable = true;
            const isCurrent = currentSub.planId === plan.id && currentSub.status === "active";

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderColor: plan.isFounder ? "var(--color-primary, #4f46e5)" : "var(--color-border-default)",
                boxShadow: plan.isFounder ? "0 4px 20px rgba(79, 70, 229, 0.12)" : "none",
                position: "relative"
              }}
            >
              {plan.isFounder && (
                <div style={{ position: "absolute", top: "-10px", right: "15px", backgroundColor: "var(--color-primary, #4f46e5)", color: "#ffffff", fontSize: "0.7rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "9999px" }}>
                  MÁS ELEGIDO
                </div>
              )}

              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
                  {plan.name}
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", margin: "0.75rem 0" }}>
                  <span style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--color-text-primary)" }}>
                    ${plan.price.toLocaleString("es-AR")}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>/mes</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      <Check size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                {(() => {
                  const isUpgrade = currentSub.status === "active" && currentSub.planId !== plan.id;
                  const buttonLabel = isCurrent
                    ? "Tu Plan Actual"
                    : !isAvailable
                    ? "Cupo Agotado"
                    : isUpgrade
                    ? `Mejorar a ${plan.name}`
                    : `Elegir ${plan.name}`;

                  return (
                    <>
                      <Button
                        variant={plan.isFounder || isUpgrade ? "primary" : "outline"}
                        disabled={!isAvailable || isLoading || isCurrent}
                        onClick={() => handleSubscribe(plan.id)}
                        style={{
                          width: "100%",
                          padding: "0.65rem",
                          fontWeight: 700
                        }}
                        icon={
                          isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isCurrent ? (
                            <Check size={14} />
                          ) : isUpgrade ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <Sparkles size={14} />
                          )
                        }
                      >
                        {buttonLabel}
                      </Button>

                      {!isCurrent && isAvailable && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.3rem",
                            fontSize: "0.725rem",
                            color: "var(--color-text-muted)",
                            marginTop: "0.5rem"
                          }}
                        >
                          <Lock size={11} />
                          <span>Pago seguro con Mercado Pago</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Legal Informativo */}
      <div style={{ marginTop: "2.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        Al contratar o utilizar nuestros servicios, aceptás nuestros{" "}
        <a
          href="/terminos"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, "", "/terminos");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          style={{ color: "var(--color-primary, #4f46e5)", textDecoration: "underline" }}
        >
          Términos del Servicio
        </a>{" "}
        y{" "}
        <a
          href="/privacidad"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, "", "/privacidad");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          style={{ color: "var(--color-primary, #4f46e5)", textDecoration: "underline" }}
        >
          Política de Privacidad
        </a>.
      </div>
    </div>
  );
};
