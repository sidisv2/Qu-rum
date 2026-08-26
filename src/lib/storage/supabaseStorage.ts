import { supabase } from "../supabase/client";
import { IStorageRepository, UploadDocumentParams, UploadResult } from "./types";

export class SupabaseStorageRepository implements IStorageRepository {
  private bucketName = "documents";

  private checkClient() {
    if (!supabase) {
      throw new Error("Supabase client no esta inicializado");
    }
  }

  async uploadDocument(params: UploadDocumentParams): Promise<UploadResult> {
    this.checkClient();
    const cleanFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${params.organizationId}/${params.documentId}/${cleanFileName}`;

    const { data, error } = await supabase!.storage
      .from(this.bucketName)
      .upload(storagePath, params.file, {
        contentType: params.contentType,
        upsert: true
      });

    if (error) {
      throw new Error(`Error subiendo archivo a Supabase Storage: ${error.message}`);
    }

    return {
      storagePath: data.path,
      fileName: cleanFileName,
      sizeBytes: params.file.size
    };
  }

  async getSignedUrl(organizationId: string, storagePath: string, expiresInSeconds: number = 3600): Promise<string> {
    this.checkClient();
    // Validacion de seguridad: el path debe pertenecer a la organizacion
    if (!storagePath.startsWith(`${organizationId}/`)) {
      throw new Error("Acceso denegado: El archivo no pertenece a su organizacion");
    }

    const { data, error } = await supabase!.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`Error generando URL firmada: ${error?.message || "No se obtuvo URL"}`);
    }

    return data.signedUrl;
  }

  async deleteDocument(organizationId: string, storagePath: string): Promise<boolean> {
    this.checkClient();
    if (!storagePath.startsWith(`${organizationId}/`)) {
      throw new Error("Acceso denegado: El archivo no pertenece a su organizacion");
    }

    const { error } = await supabase!.storage
      .from(this.bucketName)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Error eliminando archivo de Supabase Storage: ${error.message}`);
    }

    return true;
  }
}
