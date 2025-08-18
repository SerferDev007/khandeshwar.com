/**
 * UploadedFile model for document management
 * Handles file attachments for agreements, loans, and transactions
 */

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  base64: string;
  uploadedAt: string;
  compressedSize?: number;
  entityType?: 'agreement' | 'loan' | 'transaction';
  entityId?: string;
}

export interface CreateUploadedFileRequest {
  name: string;
  size: number;
  type: string;
  base64: string;
  entityType?: 'agreement' | 'loan' | 'transaction';
  entityId?: string;
}

export interface UpdateUploadedFileRequest {
  name?: string;
  entityType?: 'agreement' | 'loan' | 'transaction';
  entityId?: string;
}