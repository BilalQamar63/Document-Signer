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

  /**
   * Positive or negative contribution.
   */
  score: number;

  /**
   * Human-readable explanation.
   */
  reason: string;
}

export interface DetectionCandidate {
  pageNumber: number;

  x: number;
  y: number;

  width: number;
  height: number;

  /**
   * Optional text that produced the candidate.
   */
  text?: string;

  /**
   * Candidate source.
   */
  source: DetectionSource;

  /**
   * Confidence from 0 to 100.
   */
  confidence: number;

  evidence: DetectionEvidence[];

  /**
   * Related text item.
   */
  textItem?: PdfTextItem;

  /**
   * Related PDF line.
   */
  line?: PdfLine;
}

export interface SignatureDetectionResult {
  fields: DetectionCandidate[];

  /**
   * All candidates before confidence filtering.
   * Useful for debugging.
   */
  candidates: DetectionCandidate[];

  /**
   * Detection statistics.
   */
  stats: {
    textItems: number;
    geometryLines: number;
    candidatesGenerated: number;
    candidatesAccepted: number;
  };
}
