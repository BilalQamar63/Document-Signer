import type { DetectionCandidate } from "@/types/detection";

export function isHighConfidence(candidate: DetectionCandidate): boolean {
  return candidate.confidence >= 70;
}
