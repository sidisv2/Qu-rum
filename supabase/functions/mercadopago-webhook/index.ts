// Supabase Edge Function: mercadopago-webhook
// Verified IPN/Webhook Processor / Server-Side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const topic = body.type || body.topic;
    const resourceId = body.data?.id || body.id;

    if (topic === "subscription_preapproval" || topic === "preapproval") {
      // 1. Consultar estado real a la API de Mercado Pago
      let preapprovalStatus = "active";
      if (mpAccessToken && resourceId) {
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
          headers: { "Authorization": `Bearer ${mpAccessToken}` }
        });
        if (mpRes.ok) {
          const mpData = await mpRes.json();
          // authorized -> active, cancelled -> canceled
          if (mpData.status === "authorized") preapprovalStatus = "active";
          else if (mpData.status === "cancelled") preapprovalStatus = "canceled";
          else if (mpData.status === "pending") preapprovalStatus = "past_due";
        }
      }

      // 2. Actualizar suscripción en PostgreSQL
      if (body.external_reference) {
        await supabaseAdmin
          .from("organization_subscriptions")
          .update({
            status: preapprovalStatus,
            mercadopago_subscription_id: String(resourceId),
            updated_at: new Date().toISOString()
          })
          .eq("organization_id", body.external_reference);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Webhook processing error" }), { status: 500 });
  }
});
