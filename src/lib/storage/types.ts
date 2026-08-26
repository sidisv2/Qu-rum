export interface UploadDocumentParams {
  organizationId: string;
  documentId: string;
  file: File | Blob;
  fileName: string;
  contentType: string;
}

export interface UploadResult {
  storagePath: string;
  fileName: string;
  sizeBytes: number;
}

export interface IStorageRepository {
  uploadDocument(params: UploadDocumentParams): Promise<UploadResult>;
  getSignedUrl(organizationId: string, storagePath: string, expiresInSeconds?: number): Promise<string>;
  deleteDocument(organizationId: string, storagePath: string): Promise<boolean>;
}
