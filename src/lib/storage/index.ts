import { isSupabaseConfigured } from "../supabase/client";
import { IStorageRepository } from "./types";
import { SupabaseStorageRepository } from "./supabaseStorage";
import { LocalStorageRepository } from "./localStorage";

let storageRepoInstance: IStorageRepository | null = null;

export function getStorageRepository(): IStorageRepository {
  if (!storageRepoInstance) {
    const dataMode = (import.meta as any).env?.VITE_DATA_MODE;
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
