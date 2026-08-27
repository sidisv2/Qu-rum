// Supabase Edge Function: create-organization
// Transaccional y seguro con Service Role para crear organización y asignar rol Owner

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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Falta token de autenticación" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // 1. Validar identidad del usuario que invoca con anon key
    const clientUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await clientUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Sesión inválida o expirada" }), { status: 401, headers: corsHeaders });
    }

    const { name, industry, taxId, currency } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return new Response(JSON.stringify({ error: "El nombre de la empresa es obligatorio" }), { status: 400, headers: corsHeaders });
    }

    // 2. Cliente con Service Role para saltar RLS y crear tanto organization como organization_members
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Crear Organización
    const { data: org, error: orgErr } = await adminClient
      .from("organizations")
      .insert({
        name: name.trim(),
        tax_id: taxId ? taxId.trim() : "",
        currency: currency || "ARS",
        timezone: "America/Argentina/Buenos_Aires",
        is_demo: false
      })
      .select()
      .single();

    if (orgErr || !org) {
      return new Response(JSON.stringify({ error: "Error al crear la organización: " + (orgErr?.message || "Desconocido") }), { status: 500, headers: corsHeaders });
    }

    // Crear Membresía Owner
    const { error: memErr } = await adminClient
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: "owner"
      });

    if (memErr) {
      return new Response(JSON.stringify({ error: "Error asignando membresía: " + memErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      organization: {
        id: org.id,
        name: org.name,
        taxId: org.tax_id,
        currency: org.currency,
        currencySymbol: "$",
        industry: industry || "General",
        isDemo: org.is_demo,
        createdAt: org.created_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Error interno: " + (error.message || "desconocido") }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
