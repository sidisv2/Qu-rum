// Supabase Edge Function: create-subscription (Mercado Pago Preapproval Subscriptions)
// Server-Side Only / Zero Secret Leakage

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://direx.app",
  "https://quorum-admin-ia.vercel.app"
];

function getCorsHeaders(reqOrigin: string | null) {
  const origin = reqOrigin && allowedOrigins.includes(reqOrigin) ? reqOrigin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const reqOrigin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(reqOrigin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = req.headers.get("x-request-id") || "sub-" + crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Falta token de autenticación" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), { status: 401, headers: corsHeaders });
    }

    const { organizationId, planId, backUrl } = await req.json();

    // 1. Validar permisos de admin/owner
    const { data: member, error: memErr } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memErr || !member || (member.role !== "owner" && member.role !== "admin")) {
      return new Response(JSON.stringify({ error: "Permisos insuficientes" }), { status: 403, headers: corsHeaders });
    }

    // 2. Verificar cupo de Fundador si el plan pedido es 'founder'
    let isFounderPrice = false;
    let founderExpiresAt = null;

    if (planId === "founder") {
      const { data: count, error: countErr } = await supabaseClient.rpc("get_founder_slots_count");
      if (!countErr && typeof count === "number" && count >= 10) {
        return new Response(JSON.stringify({ error: "El cupo de 10 clientes Fundadores se encuentra agotado" }), { status: 400, headers: corsHeaders });
      }
      isFounderPrice = true;
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      founderExpiresAt = oneYear.toISOString();
    }

    // 3. Obtener datos del plan
    const { data: plan, error: planErr } = await supabaseClient
      .from("subscription_plans")
      .select("name, price_ars")
      .eq("id", planId)
      .single();

    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: "Plan inexistente" }), { status: 400, headers: corsHeaders });
    }

    // 4. Crear Preapproval en Mercado Pago API
    let initPoint = "";
    if (mpAccessToken) {
      const mpResponse = await fetch("https://api.mercadopago.com/preapproval_plan", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: `Direx — ${plan.name}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: Number(plan.price_ars),
            currency_id: "ARS"
          },
          back_url: backUrl || "https://quorum-admin-ia.vercel.app"
        })
      });

      const mpData = await mpResponse.json();
      initPoint = mpData.init_point || mpData.sandbox_init_point || "";
    }

    // Si es modo sandbox o demo sin token configurado, generar fallback seguro
    if (!initPoint) {
      initPoint = `https://www.mercadopago.com.ar/subscriptions/checkout?pref_id=sandbox-${planId}-${organizationId}`;
    }

    // 5. Registrar / actualizar estado en base de datos
    await supabaseClient
      .from("organization_subscriptions")
      .upsert({
        organization_id: organizationId,
        plan_id: planId,
        status: "trialing",
        is_founder_price: isFounderPrice,
        founder_price_expires_at: founderExpiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: "organization_id" });

    return new Response(JSON.stringify({
      checkoutUrl: initPoint,
      planId,
      isFounderPrice,
      requestId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Error interno procesando suscripción" }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
