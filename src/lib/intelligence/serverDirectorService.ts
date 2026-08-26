import { supabase } from "../supabase/client";
import { DirectorRequest, DirectorResponse, DirectorError } from "./directorContract";

export class ServerDirectorService {
  public static async askDirector(request: DirectorRequest): Promise<DirectorResponse> {
    if (!supabase) {
      throw new Error("Supabase client no configurado");
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const err: DirectorError = {
        code: "UNAUTHENTICATED",
        message: "Debe iniciar sesion para consultar al Director IA"
      };
      throw err;
    }

    // Invocar Edge Function de Supabase
    const { data, error } = await supabase.functions.invoke("director-ia", {
      body: request
    });

    if (error || data?.error) {
      const err: DirectorError = {
        code: data?.error?.code || "LLM_UNAVAILABLE",
        message: data?.error?.message || error?.message || "No se pudo conectar con el Director IA"
      };
      throw err;
    }

    return data as DirectorResponse;
  }
}
