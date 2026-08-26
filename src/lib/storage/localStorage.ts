import { IStorageRepository, UploadDocumentParams, UploadResult } from "./types";

export class LocalStorageRepository implements IStorageRepository {
  private inMemoryStore: Map<string, { blob: Blob; fileName: string; size: number }> = new Map();

  async uploadDocument(params: UploadDocumentParams): Promise<UploadResult> {
    const cleanFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${params.organizationId}/${params.documentId}/${cleanFileName}`;

    this.inMemoryStore.set(storagePath, {
      blob: params.file,
      fileName: cleanFileName,
      size: params.file.size
    });

    return {
      storagePath,
      fileName: cleanFileName,
      sizeBytes: params.file.size
    };
  }

  async getSignedUrl(organizationId: string, storagePath: string, _expiresInSeconds: number = 3600): Promise<string> {
    if (!storagePath.startsWith(`${organizationId}/`)) {
      throw new Error("Acceso denegado: El archivo no pertenece a su organizacion");
    }

    const item = this.inMemoryStore.get(storagePath);
    if (item && typeof URL !== "undefined" && URL.createObjectURL) {
      return URL.createObjectURL(item.blob);
    }
    return `#mock-url/${storagePath}`;
  }

  async deleteDocument(organizationId: string, storagePath: string): Promise<boolean> {
    if (!storagePath.startsWith(`${organizationId}/`)) {
      throw new Error("Acceso denegado: El archivo no pertenece a su organizacion");
    }

    this.inMemoryStore.delete(storagePath);
    return true;
  }
}
