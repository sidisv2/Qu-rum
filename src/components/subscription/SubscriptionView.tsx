import React, { useState, useEffect } from "react";
import { CreditCard, Check, Sparkles, Clock, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
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
  const [founderSlotsTaken, setFounderSlotsTaken] = useState<number | null>(null);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription>({
    planId: "founder",
    status: "trialing",
    isFounderPrice: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const plans: Plan[] = [
    {
      id: "founder",
      name: "Plan Fundador",
      price: 9900,
      maxUsers: 5,
      isFounder: true,
      features: [
        "Director IA ilimitado",
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
        "Director IA estándar",
        "Ventas, Gastos y Cobranzas",
        "Hasta 2 usuarios",
        "Importador universal CSV"
      ]
    },
    {
      id: "pro",
      name: "Plan Pro",
      price: 44900,
      maxUsers: 10,
      features: [
        "Director IA Avanzado",
        "Hasta 10 usuarios incluidos",
        "Almacenamiento extendido de comprobantes",
        "Soporte prioritario 24/7",
        "Todas las funcionalidades"
      ]
    }
  ];

  useEffect(() => {
    async function loadSubscriptionData() {
      if (!currentOrg?.id) return;
      setIsInitializing(true);
      try {
        if (supabase) {
          // 1. Consultar cupos de Fundador
          const { data: slots, error: slotsErr } = await supabase.rpc("get_founder_slots_count");
          if (!slotsErr && typeof slots === "number") {
            setFounderSlotsTaken(slots);
          } else {
            setFounderSlotsTaken(0);
          }

          // 2. Consultar suscripción actual
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
    if (!currentOrg?.id) return;
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
          setActionError(error.message || "No se pudo iniciar el proceso de suscripción");
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

  const isFounderAvailable = founderSlotsTaken === null || founderSlotsTaken < 10;

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
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Estado Actual del Tenant */}
      <div className="card" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Sparkles size={24} style={{ color: "#16a34a" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#166534" }}>
              Estado: {currentSub.status === "active" ? "Suscripción Activa" : "Período de Prueba Activo (Beta Tester)"}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>
              {currentSub.status === "active"
                ? "Tu cuenta cuenta con suscripción recurrente activa."
                : "Tenés acceso completo a todas las herramientas de Direx sin interrupciones."}
            </div>
          </div>
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "9999px", backgroundColor: "#dcfce7", color: "#166534", textTransform: "uppercase" }}>
          {currentSub.status}
        </span>
      </div>

      {/* Cupos de Fundador */}
      {isFounderAvailable && (
        <div className="card" style={{ backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b21a8" }}>
              <Clock size={18} />
              <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                Cupo Exclusivo de Fundadores: Quedan {10 - (founderSlotsTaken || 0)} de 10 lugares
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7e22ce" }}>
              $9.900/mes x 12 meses
            </span>
          </div>
        </div>
      )}

      {/* Tarjetas de Planes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {plans.map(plan => {
          const isAvailable = plan.id !== "founder" || isFounderAvailable;
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
                <Button
                  variant={plan.isFounder ? "primary" : "outline"}
                  disabled={!isAvailable || isLoading || isCurrent}
                  onClick={() => handleSubscribe(plan.id)}
                  style={{ width: "100%", padding: "0.65rem" }}
                  icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                >
                  {isCurrent ? "Plan Actual" : isAvailable ? "Suscribirse con Mercado Pago" : "Cupo Agotado"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
