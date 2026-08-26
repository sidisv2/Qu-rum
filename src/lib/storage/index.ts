import { isSupabaseConfigured } from "../supabase/client";
import { IStorageRepository } from "./types";
import { SupabaseStorageRepository } from "./supabaseStorage";
import { LocalStorageRepository } from "./localStorage";

let storageRepoInstance: IStorageRepository | null = null;

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

export function getStorageRepository(forceLocal: boolean = false): IStorageRepository {
  if (forceLocal) {
    return new LocalStorageRepository();
  }
  if (!storageRepoInstance) {
    const dataMode = getEnvVar("VITE_DATA_MODE");
    if (dataMode === "supabase" && isSupabaseConfigured()) {
      storageRepoInstance = new SupabaseStorageRepository();
    } else {
      storageRepoInstance = new LocalStorageRepository();
    }
  }
  return storageRepoInstance;
}

export * from "./types";
export * from "./supabaseStorage";
export * from "./localStorage";
