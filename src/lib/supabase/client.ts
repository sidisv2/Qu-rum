import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Helper to safely get environment variables across Vite runtime, Vercel build and Node/Test environments
const readEnv = (key: string): string => {
  try {
    const meta = import.meta as any;
    if (meta && meta.env && typeof meta.env[key] !== "undefined") {
      return meta.env[key] || "";
    }
  } catch (_e) {
    // fallback
  }
  if (typeof process !== "undefined" && process.env && typeof process.env[key] !== "undefined") {
    return process.env[key] || "";
  }
  return "";
};

const supabaseUrl: string =
  readEnv("VITE_SUPABASE_URL") || "https://ychqcwbpzmjpsbowzvpk.supabase.co";

const supabaseAnonKey: string =
  readEnv("VITE_SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHFjd2Jwem1qcHNib3d6dnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjQzMDEsImV4cCI6MjEwMzM0MDMwMX0.yjZbiYIc0L870NPBP3pAaUDbMlFnLODbTgzFhCnp_f0";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseUrl.startsWith("http")
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
