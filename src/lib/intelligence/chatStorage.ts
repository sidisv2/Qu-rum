import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface ChatMessageRecord {
  id: string;
  sender: "user" | "ia";
  text: string;
  timestamp: string;
}

const LOCAL_STORAGE_CHAT_PREFIX = "direx_ai_chat_";

export class ChatStorageService {
  /**
   * Cargar mensajes del chat para la organización activa
   */
  public static async loadMessages(
    organizationId: string,
    fallbackWelcomeText: string
  ): Promise<ChatMessageRecord[]> {
    if (!organizationId) {
      return [{ id: "welcome-1", sender: "ia", text: fallbackWelcomeText, timestamp: new Date().toISOString() }];
    }

    // 1. Si Supabase está configurado, intentar cargar desde la base de datos remota
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("ai_messages")
          .select("id, role, content, created_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (!error && data && data.length > 0) {
          return data.map((msg: any) => ({
            id: msg.id,
            sender: msg.role === "user" ? "user" : "ia",
            text: msg.content,
            timestamp: msg.created_at
          }));
        }
      } catch (err) {
        console.warn("Fallo de lectura en ai_messages remoto, usando fallback local:", err);
      }
    }

    // 2. Fallback a LocalStorage aislado por organization_id
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const localData = window.localStorage.getItem(LOCAL_STORAGE_CHAT_PREFIX + organizationId);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {}

    // 3. Mensaje inicial por defecto
    return [{ id: "welcome-1", sender: "ia", text: fallbackWelcomeText, timestamp: new Date().toISOString() }];
  }

  /**
   * Guardar un nuevo mensaje en el historial del chat
   */
  public static async saveMessage(
    organizationId: string,
    userId: string | undefined,
    sender: "user" | "ia",
    text: string
  ): Promise<ChatMessageRecord> {
    const newMsg: ChatMessageRecord = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    // 1. Guardar en Supabase si está disponible
    if (isSupabaseConfigured() && supabase && userId) {
      try {
        await supabase.from("ai_messages").insert({
          organization_id: organizationId,
          user_id: userId,
          role: sender === "user" ? "user" : "assistant",
          content: text
        });
      } catch (err) {
        console.warn("Fallo de guardado en ai_messages remoto, sincronizando local:", err);
      }
    }

    // 2. Sincronizar en LocalStorage
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const key = LOCAL_STORAGE_CHAT_PREFIX + organizationId;
        const currentData = window.localStorage.getItem(key);
        const list: ChatMessageRecord[] = currentData ? JSON.parse(currentData) : [];
        list.push(newMsg);
        // Mantener últimos 50 mensajes
        if (list.length > 50) list.shift();
        window.localStorage.setItem(key, JSON.stringify(list));
      }
    } catch {}

    return newMsg;
  }

  /**
   * Limpiar historial de la conversación para la organización activa
   */
  public static async clearHistory(organizationId: string, userId?: string): Promise<void> {
    // 1. Borrar en Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from("ai_messages")
          .delete()
          .eq("organization_id", organizationId);
      } catch (err) {
        console.warn("Fallo al limpiar ai_messages remoto:", err);
      }
    }

    // 2. Borrar en LocalStorage
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(LOCAL_STORAGE_CHAT_PREFIX + organizationId);
      }
    } catch {}
  }
}
