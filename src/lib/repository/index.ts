import { IDataRepository } from "./types";
import { LocalRepository } from "./localRepository";
import { SupabaseRepository } from "./supabaseRepository";
import { isSupabaseConfigured } from "../supabase/client";

export * from "./types";
export * from "./localRepository";
export * from "./supabaseRepository";

const getEnvVar = (key: string): string => {
  const anyMeta = import.meta as any;
  if (typeof anyMeta !== "undefined" && anyMeta.env) {
    return anyMeta.env[key] || "";
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || "";
  }
  return "";
};

export const getRepository = (): IDataRepository => {
  const mode = getEnvVar("VITE_DATA_MODE") || "local";
  
  if (mode === "supabase" && isSupabaseConfigured()) {
    return new SupabaseRepository();
  }
  
  return new LocalRepository();
};
