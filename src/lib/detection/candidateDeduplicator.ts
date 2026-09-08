import type { DetectionCandidate } from "@/types/detection";
import { DETECTION_CONFIG } from "./detectionConfig";

function overlaps(a: DetectionCandidate, b: DetectionCandidate): boolean {
  if (a.pageNumber !== b.pageNumber) return false;
  const nearby =
    Math.abs(a.x - b.x) <= DETECTION_CONFIG.DUPLICATE_X_DISTANCE &&
    Math.abs(a.y - b.y) <= DETECTION_CONFIG.DUPLICATE_Y_DISTANCE;
  return (
    nearby ||
    (a.x <= b.x + b.width &&
      b.x <= a.x + a.width &&
      a.y <= b.y + b.height &&
      b.y <= a.y + a.height)
  );
}
export function deduplicateCandidates(
  candidates: DetectionCandidate[],
): DetectionCandidate[] {
  const selected: DetectionCandidate[] = [];
  for (const candidate of [...candidates].sort(
    (a, b) => b.confidence - a.confidence,
  ))
    if (!selected.some((chosen) => overlaps(chosen, candidate)))
      selected.push(candidate);
  return selected.sort(
    (a, b) => a.pageNumber - b.pageNumber || b.y - a.y || a.x - b.x,
  );
}
