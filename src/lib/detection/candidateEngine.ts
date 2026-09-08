import type {
  DetectionCandidate,
  DetectionEvidence,
  DetectionSource,
} from "@/types/detection";
import type { PdfTextItem } from "@/types/pdf";
import type { PdfLine } from "@/types/pdfGeomatry";
import { DETECTION_CONFIG } from "./detectionConfig";

interface CandidateInput {
  pageNumber: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  source: DetectionSource;
  evidence: DetectionEvidence[];
  textItem?: PdfTextItem;
  line?: PdfLine;
}

export function createCandidate(input: CandidateInput): DetectionCandidate {
  const confidence = input.evidence.reduce((sum, item) => sum + item.score, 0);
  return {
    ...input,
    width: Math.max(
      input.width ?? DETECTION_CONFIG.DEFAULT_SIGNATURE_WIDTH,
      DETECTION_CONFIG.MIN_SIGNATURE_WIDTH,
    ),
    height: input.height ?? DETECTION_CONFIG.DEFAULT_SIGNATURE_HEIGHT,
    confidence: Math.max(
      DETECTION_CONFIG.MIN_CONFIDENCE,
      Math.min(DETECTION_CONFIG.MAX_CONFIDENCE, confidence),
    ),
  };
}

export function evidence(
  type: DetectionEvidence["type"],
  score: number,
  reason: string,
): DetectionEvidence {
  return { type, score, reason };
}
