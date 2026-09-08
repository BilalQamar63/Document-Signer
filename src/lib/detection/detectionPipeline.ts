import type { PdfFormField } from "@/lib/pdf/pdfFormFieldExtractor";
import type {
  DetectionCandidate,
  SignatureDetectionResult,
} from "@/types/detection";
import type { PdfTextItem } from "@/types/pdf";
import type { PdfGeometry } from "@/types/pdfGeomatry";
import { createCandidate, evidence } from "./candidateEngine";
import { deduplicateCandidates } from "./candidateDeduplicator";
import {
  analyzeTextContext,
  hasExplicitSignatureLine,
  isSignatureLabel,
  normalizeDetectionText,
} from "./contextAnalyzer";
import { DETECTION_CONFIG } from "./detectionConfig";
import { findBestSignatureLine } from "./labelLineMatcher";
import { looksLikePersonName } from "./personDetector";
import { isSignerRole } from "./roleDetector";
import {
  findSignatureSections,
  itemsBelowSection,
} from "./signatureSectionDetector";

export function runSignatureDetection(
  items: PdfTextItem[],
  geometry?: PdfGeometry,
  formFields: PdfFormField[] = [],
): SignatureDetectionResult {
  const candidates: DetectionCandidate[] = [];
  const lines = geometry?.pages.flatMap((page) => page.lines) ?? [];
  for (const field of formFields.filter((field) => field.isSignatureField))
    candidates.push(
      createCandidate({
        pageNumber: field.pageNumber,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        text: field.name || "Signature",
        source: "acroform",
        evidence: [
          evidence("acroform-field", 100, "PDF AcroForm signature field."),
        ],
      }),
    );
  for (const item of items) {
    const context = analyzeTextContext(item, items);
    const normalized = normalizeDetectionText(item.text);
    if (
      !isSignatureLabel(item.text) ||
      normalized === "signatures" ||
      normalized === "signatures:" ||
      context.isIndex ||
      context.isIndexEntry ||
      context.isDigitalSignatureExplanation ||
      context.isNormalParagraph
    )
      continue;
    const match = findBestSignatureLine(item, lines);
    const explicit = hasExplicitSignatureLine(item.text);
    const textLine = item.text.match(/_{4,}|-{6,}/)?.[0];
    if (match)
      candidates.push(
        createCandidate({
          pageNumber: item.pageNumber,
          x: Math.min(match.line.x1, match.line.x2),
          y: match.line.y1 - 18,
          width: match.line.length,
          height: 38,
          text: item.text,
          source: "geometry",
          textItem: item,
          line: match.line,
          evidence: [
            evidence("signature-label", 35, "Explicit signature label."),
            evidence("horizontal-line", 25, "Nearby drawn horizontal line."),
            evidence(
              "label-line-match",
              Math.min(35, match.score),
              "Label matched to drawn line.",
            ),
          ],
        }),
      );
    else if (explicit && textLine)
      candidates.push(
        createCandidate({
          pageNumber: item.pageNumber,
          x: item.x + Math.max(0, item.width - textLine.length * 7),
          y: item.y - 18,
          width: Math.max(
            DETECTION_CONFIG.MIN_SIGNATURE_WIDTH,
            textLine.length * 7,
          ),
          height: 38,
          text: item.text,
          source: "explicit-line",
          textItem: item,
          evidence: [
            evidence("signature-label", 35, "Explicit signature label."),
            evidence("horizontal-line", 50, "Underscore/dash signature line."),
          ],
        }),
      );
    else
      candidates.push(
        createCandidate({
          pageNumber: item.pageNumber,
          x: item.x + item.width + 12,
          y: item.y - 18,
          width: DETECTION_CONFIG.DEFAULT_SIGNATURE_WIDTH,
          height: 38,
          text: item.text,
          source: "explicit-line",
          textItem: item,
          evidence: [
            evidence("signature-label", 40, "Explicit signature label."),
            evidence("nearby-context", 32, "Label-only form fallback."),
          ],
        }),
      );
  }
  for (const section of findSignatureSections(items))
    for (const item of itemsBelowSection(
      section,
      items,
      DETECTION_CONFIG.SECTION_CONTEXT_DISTANCE,
    )) {
      const person = looksLikePersonName(item.text);
      const role = isSignerRole(item.text);
      if (!person && !role) continue;
      candidates.push(
        createCandidate({
          pageNumber: item.pageNumber,
          x: item.x,
          y: item.y - 50,
          width: Math.max(item.width, DETECTION_CONFIG.DEFAULT_SIGNATURE_WIDTH),
          height: 42,
          text: item.text,
          source: person ? "person" : "role",
          textItem: item,
          evidence: [
            evidence(
              "signature-section",
              38,
              "Signer listed under a Signatures section.",
            ),
            evidence(
              person ? "person-name" : "signer-role",
              38,
              person ? "Person name detected." : "Signer role detected.",
            ),
          ],
        }),
      );
    }
  const fields = deduplicateCandidates(candidates).filter(
    (candidate) =>
      candidate.confidence >= DETECTION_CONFIG.HIGH_CONFIDENCE_THRESHOLD,
  );
  return {
    fields,
    candidates,
    stats: {
      textItems: items.length,
      geometryLines: lines.length,
      candidatesGenerated: candidates.length,
      candidatesAccepted: fields.length,
    },
  };
}
