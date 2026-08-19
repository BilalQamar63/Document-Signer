import type { SignatureField } from "./signature";

export interface SigningState {
  document: File | null;

  signatureFields: SignatureField[];

  activeFieldId: string | null;

  completed: boolean;
}
