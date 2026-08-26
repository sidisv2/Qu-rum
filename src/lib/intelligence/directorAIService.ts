import { InsightEngine, EngineInput } from "./insightEngine";
import { BusinessAnalyticsResult } from "./types";
import { DirectorRequest, DirectorResponse } from "./directorContract";
import { ServerDirectorService } from "./serverDirectorService";
import { LocalDirectorService } from "./localDirectorService";
import { isSupabaseConfigured } from "../supabase/client";

export class DirectorAIService {
  public static getAnalytics(input: EngineInput): BusinessAnalyticsResult {
    return InsightEngine.analyze(input);
  }

  public static async answerExecutiveQuery(params: {
    question: string;
    orgData: EngineInput;
    organizationName: string;
    organizationId?: string;
  }): Promise<{ answer: string; structuredInsights?: any[]; evidence?: any; actions?: any[] }> {
    const dataMode = (import.meta as any).env?.VITE_DATA_MODE;

    const request: DirectorRequest = {
      question: params.question,
      organizationId: params.organizationId
    };

    // Si opera en modo Supabase real y configurado, invoca al servidor seguro
    if (dataMode === "supabase" && isSupabaseConfigured()) {
      try {
        const response = await ServerDirectorService.askDirector(request);
        return {
          answer: response.answer,
          structuredInsights: response.structuredInsights,
          actions: response.actions
        };
      } catch (err: any) {
        console.warn("Fallo en llamada a Director Server-Side, ejecutando fallback local seguro:", err.message);
      }
    }

    // Modo local / Fallback
    const localRes = await LocalDirectorService.askLocalDirector(request, params.orgData, params.organizationName);
    return {
      answer: localRes.answer,
      structuredInsights: localRes.structuredInsights,
      actions: localRes.actions
    };
  }
}
