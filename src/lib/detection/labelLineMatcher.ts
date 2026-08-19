import type { PdfTextItem } from "@/types/pdf";

import { DETECTION_CONFIG } from "./detectionConfig";

import { isSignatureLabel, normalizeDetectionText } from "./contextAnalyzer";
import { PdfLine } from "@/types/pdfGeomatry";

export interface LabelLineMatch {
  label: PdfTextItem;
  line: PdfLine;

  distanceX: number;
  distanceY: number;

  score: number;
}

/**
 * Get approximate center of a text item.
 */
function getTextCenter(item: PdfTextItem) {
  return {
    x: item.x + item.width / 2,

    y: item.y + item.height / 2,
  };
}

/**
 * Determine whether a line is long enough
 * to be considered an input/signature line.
 */
function isUsableInputLine(line: PdfLine): boolean {
  return (
    line.orientation === "horizontal" &&
    line.length >= DETECTION_CONFIG.MIN_HORIZONTAL_LINE_LENGTH
  );
}

/**
 * Match signature labels to nearby horizontal lines.
 *
 * Example:
 *
 * Signature:
 *
 * ─────────────────────
 *
 * becomes a strong candidate.
 */
export function matchSignatureLabelsToLines(
  textItems: PdfTextItem[],
  lines: PdfLine[],
): LabelLineMatch[] {
  const matches: LabelLineMatch[] = [];

  const signatureLabels = textItems.filter((item) =>
    isSignatureLabel(item.text),
  );

  const usableLines = lines.filter(isUsableInputLine);

  for (const label of signatureLabels) {
    const labelCenter = getTextCenter(label);

    let bestMatch: LabelLineMatch | null = null;

    for (const line of usableLines) {
      if (line.pageNumber !== label.pageNumber) {
        continue;
      }

      /**
       * A signature line normally appears
       * below the label.
       *
       * PDF text coordinates can vary depending
       * on how the extractor represents them,
       * so we allow both nearby directions,
       * but prefer below.
       */
      const lineCenterX = (line.x1 + line.x2) / 2;

      const lineCenterY = (line.y1 + line.y2) / 2;

      const distanceX = Math.abs(lineCenterX - labelCenter.x);

      const distanceY = Math.abs(lineCenterY - labelCenter.y);

      if (distanceY > DETECTION_CONFIG.MAX_LABEL_LINE_VERTICAL_DISTANCE) {
        continue;
      }

      if (distanceX > DETECTION_CONFIG.MAX_LABEL_LINE_HORIZONTAL_DISTANCE) {
        continue;
      }

      /**
       * Prefer lines that are:
       *
       * - below the label
       * - horizontally aligned
       * - long
       */
      let score = 0;

      /**
       * Horizontal alignment.
       */
      if (distanceX <= 30) {
        score += 30;
      } else if (distanceX <= 80) {
        score += 20;
      } else {
        score += 10;
      }

      /**
       * Distance.
       */
      if (distanceY <= 15) {
        score += 30;
      } else if (distanceY <= 30) {
        score += 20;
      } else {
        score += 10;
      }

      /**
       * Longer lines are more likely to be
       * form fields.
       */
      if (line.length >= 200) {
        score += 20;
      } else if (line.length >= 120) {
        score += 15;
      } else {
        score += 5;
      }

      /**
       * Avoid absurdly short lines.
       */
      if (line.length < DETECTION_CONFIG.MIN_SIGNATURE_WIDTH) {
        score -= 20;
      }

      const candidate: LabelLineMatch = {
        label,
        line,

        distanceX,
        distanceY,

        score,
      };

      if (!bestMatch || candidate.score > bestMatch.score) {
        bestMatch = candidate;
      }
    }

    if (bestMatch) {
      matches.push(bestMatch);
    }
  }

  return matches;
}

/**
 * Find the best signature line for one label.
 */
export function findBestSignatureLine(
  label: PdfTextItem,
  lines: PdfLine[],
): LabelLineMatch | null {
  const matches = matchSignatureLabelsToLines([label], lines);

  return matches[0] ?? null;
}

/**
 * Useful for debugging.
 */
export function describeLabelLineMatch(match: LabelLineMatch): string {
  return [
    `Label: "${normalizeDetectionText(match.label.text)}"`,
    `Page: ${match.label.pageNumber}`,
    `Line length: ${match.line.length.toFixed(1)}`,
    `Distance X: ${match.distanceX.toFixed(1)}`,
    `Distance Y: ${match.distanceY.toFixed(1)}`,
    `Score: ${match.score}`,
  ].join(" | ");
}
