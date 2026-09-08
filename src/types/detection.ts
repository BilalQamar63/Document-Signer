import type { PdfTextItem } from "@/types/pdf";
import { PdfLine } from "./pdfGeomatry";

export type DetectionSource =
  | "acroform"
  | "explicit-line"
  | "geometry"
  | "signature-section"
  | "person"
  | "role"
  | "combined";

export type DetectionEvidenceType =
  | "signature-keyword"
  | "signature-label"
  | "signature-section"
  | "person-name"
  | "signer-role"
  | "horizontal-line"
  | "label-line-match"
  | "acroform-field"
  | "nearby-context"
  | "toc"
  | "index"
  | "paragraph"
  | "digital-signature-text";

export interface DetectionEvidence {
  type: DetectionEvidenceType;
  score: number;
  reason: string;
}

export interface DetectionCandidate {
  pageNumber: number;

  x: number;
  y: number;

  width: number;
  height: number;

  text?: string;

  source: DetectionSource;

  confidence: number;

  evidence: DetectionEvidence[];

  textItem?: PdfTextItem;

  line?: PdfLine;
}

export interface SignatureDetectionResult {
  fields: DetectionCandidate[];

  candidates: DetectionCandidate[];

  stats: {
    textItems: number;
    geometryLines: number;
    candidatesGenerated: number;
    candidatesAccepted: number;
  };
}
