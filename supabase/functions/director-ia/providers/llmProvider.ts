// Contract for Server-Side LLM Providers in Supabase Edge Functions

export interface LLMRequest {
  systemPrompt: string;
  financialContext: string;
  userPrompt: string;
  model?: string;
  timeoutMs?: number;
}

export interface LLMResponse {
  answer: string;
  raw?: any;
  modelUsed: string;
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
