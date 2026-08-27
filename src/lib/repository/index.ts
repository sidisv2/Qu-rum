import { IDataRepository } from "./types";
import { LocalRepository } from "./localRepository";
import { SupabaseRepository } from "./supabaseRepository";
import { isSupabaseConfigured } from "../supabase/client";

export * from "./types";
export * from "./localRepository";
export * from "./supabaseRepository";

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

export const getRepository = (): IDataRepository => {
  const mode = readEnv("VITE_DATA_MODE");
  
  // If explicitly local, return LocalRepository. Otherwise if Supabase is configured, use SupabaseRepository
  if (mode === "local") {
    return new LocalRepository();
  }

  if (isSupabaseConfigured()) {
    return new SupabaseRepository();
  }
  
  return new LocalRepository();
};
