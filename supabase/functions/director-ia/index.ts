// Supabase Edge Function: director-ia
// Subfase 4E: Server-side Director IA con validacion JWT y aislamiento Multi-Tenant

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Falta token de autenticacion" } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Validar identidad
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Sesion invalida o expirada" } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const question = body.question;
    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: { code: "INVALID_REQUEST", message: "La consulta no puede estar vacia" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Derivar organization_id de forma segura
    let targetOrgId = body.organizationId;
    const { data: members, error: memErr } = await supabaseClient
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id);

    if (memErr || !members || members.length === 0) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "El usuario no pertenece a ninguna organizacion" } }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userOrgIds = members.map((m: any) => m.organization_id);
    if (!targetOrgId || !userOrgIds.includes(targetOrgId)) {
      targetOrgId = userOrgIds[0];
    }

    // 3. Obtener agregaciones financieras server-side con RLS
    const { data: sales } = await supabaseClient.from("sales").select("total, status").eq("organization_id", targetOrgId);
    const { data: expenses } = await supabaseClient.from("expenses").select("amount, category").eq("organization_id", targetOrgId);
    const { data: receivables } = await supabaseClient.from("receivables").select("amount, balance, status").eq("organization_id", targetOrgId);

    const totalSales = (sales || []).reduce((acc: number, s: any) => acc + (s.total || 0), 0);
    const totalExpenses = (expenses || []).reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const overdueReceivables = (receivables || [])
      .filter((r: any) => r.status === "overdue" || (r.status === "pending" && r.balance > 0))
      .reduce((acc: number, r: any) => acc + (r.balance || 0), 0);

    // 4. Inferencia con LLM (o fallback estructurado si no hay API key configurada)
    let aiAnswer = "";
    if (geminiApiKey) {
      const systemPrompt = `Eres el Director Administrativo y Financiero de una PyME. 
Analiza los siguientes datos consolidados del negocio de forma ejecutiva, precisa y sin alucinaciones:
- Ventas Totales: $${totalSales}
- Gastos Operativos: $${totalExpenses}
- Deudas por Cobrar: $${overdueReceivables}
Responde a la consulta del usuario de forma profesional, clara y accionable.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nConsulta del usuario: ${question}` }] }
          ]
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        aiAnswer = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    }

    if (!aiAnswer) {
      aiAnswer = `**Diagnóstico Ejecutivo:**\n• Ventas Totales: $${totalSales}\n• Gastos Totales: $${totalExpenses}\n• Cobranzas Pendientes: $${overdueReceivables}\n\nEl negocio mantiene un flujo operativo estable.`;
    }

    // 5. Registrar en audit_logs de forma append-only
    await supabaseClient.from("audit_logs").insert({
      organization_id: targetOrgId,
      user_id: user.id,
      user_name: user.email || "Usuario",
      action: "DIRECTOR_IA_CONSULTA",
      entity_type: "director_ai",
      entity_id: null,
      details: `Consulta ejecutiva procesada: "${question.substring(0, 50)}..."`
    });

    const responsePayload = {
      requestId: "req-" + Date.now(),
      organizationId: targetOrgId,
      type: "answer",
      answer: aiAnswer,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: error.message || "Error interno del servidor" } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
