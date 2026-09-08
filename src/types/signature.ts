export type SignatureStatus = "pending" | "signed";

export interface SignatureField {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  status: SignatureStatus;
  signatureDataUrl?: string;
}
