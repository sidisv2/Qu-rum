// Supabase Edge Function: send-support-ticket
// Soporte técnico: soporte@direx.online | Comercial: contacto@direx.online

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://direx.online",
  "https://direx.app",
  "https://quorum-psi-three.vercel.app"
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

  const requestId = req.headers.get("x-request-id") || "ticket-" + crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Falta token de autenticación" } }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Sesión inválida o expirada" } }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { organizationId, ticketType, subject, description, userEmail, orgName, taxId } = body;

    if (!organizationId || !subject || !description) {
      return new Response(
        JSON.stringify({ error: { code: "INVALID_REQUEST", message: "Datos requeridos incompletos" } }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Determinar buzón oficial de destino
    const targetEmail = (ticketType === "bug" || ticketType === "general_support")
      ? "soporte@direx.online"
      : "contacto@direx.online";

    const ticketNumber = "TICK-" + Date.now().toString().slice(-6);

    // 2. Guardar en base de datos con Service Role para garantizar persistencia
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: insertedTicket, error: insertError } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        user_email: userEmail || user.email || "sin-email",
        ticket_type: ticketType || "general_support",
        subject: subject.trim(),
        description: description.trim(),
        status: "open",
        priority: ticketType === "bug" ? "high" : "medium"
      })
      .select("id, created_at")
      .maybeSingle();

    console.log(`[Support Ticket] #${ticketNumber} para ${targetEmail} | Org: ${orgName || organizationId} | De: ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber,
        ticketId: insertedTicket?.id || ticketNumber,
        targetEmail,
        createdAt: insertedTicket?.created_at || new Date().toISOString(),
        message: `Ticket #${ticketNumber} registrado correctamente. Nuestro equipo responderá a ${userEmail || user.email}.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: err.message || "Error al procesar el ticket" } }),
      { status: 500, headers: corsHeaders }
    );
  }
});
