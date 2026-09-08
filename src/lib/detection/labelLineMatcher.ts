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

function getTextCenter(item: PdfTextItem) {
  return {
    x: item.x + item.width / 2,

    y: item.y + item.height / 2,
  };
}

function isUsableInputLine(line: PdfLine): boolean {
  return (
    line.orientation === "horizontal" &&
    line.length >= DETECTION_CONFIG.MIN_HORIZONTAL_LINE_LENGTH
  );
}

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

      let score = 0;

      if (distanceX <= 30) {
        score += 30;
      } else if (distanceX <= 80) {
        score += 20;
      } else {
        score += 10;
      }

      if (distanceY <= 15) {
        score += 30;
      } else if (distanceY <= 30) {
        score += 20;
      } else {
        score += 10;
      }

      if (line.length >= 200) {
        score += 20;
      } else if (line.length >= 120) {
        score += 15;
      } else {
        score += 5;
      }

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

export function findBestSignatureLine(
  label: PdfTextItem,
  lines: PdfLine[],
): LabelLineMatch | null {
  const matches = matchSignatureLabelsToLines([label], lines);

  return matches[0] ?? null;
}

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
