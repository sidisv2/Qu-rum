// OpenRouter Provider Implementation for Supabase Edge Functions

import { LLMProvider, LLMRequest, LLMResponse } from "./llmProvider.ts";

export class OpenRouterProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    this.apiKey = apiKey || Deno.env.get("OPENROUTER_API_KEY") || "";
    this.defaultModel = defaultModel || Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash";
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY no está configurada en el servidor");
    }

    const model = request.model || this.defaultModel;
    const timeoutMs = request.timeoutMs || 8000;

    const fullPrompt = `${request.systemPrompt}

<financial_context>
${request.financialContext}
</financial_context>

<user_prompt>
${request.userPrompt}
</user_prompt>`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://direx.online",
          "X-Title": "Direx AI Director"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: request.systemPrompt
            },
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.6
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content?.trim() || "";

      if (!answer) {
        throw new Error("Respuesta vacía o inválida de OpenRouter");
      }

      return {
        answer,
        raw: data,
        modelUsed: model
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Timeout comunicando con OpenRouter (excedió 8s)");
      }
      throw error;
    }
  }
}
