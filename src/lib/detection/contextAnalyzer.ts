import type { PdfTextItem } from "@/types/pdf";
import { DETECTION_CONFIG } from "./detectionConfig";

export interface TextContextResult {
  isTableOfContents: boolean;
  isIndex: boolean;
  isIndexEntry: boolean;
  isNormalParagraph: boolean;
  isDigitalSignatureExplanation: boolean;

  isSignatureSection: boolean;
  isSignatureLabel: boolean;

  isExplicitSignatureLine: boolean;

  scoreModifier: number;

  reasons: string[];
}

export function normalizeDetectionText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function isSignatureLabel(text: string): boolean {
  const normalized = normalizeDetectionText(text);

  const value = normalized.replace(/:$/, "").trim();

  if (value === "signature" || value === "signatures") {
    return true;
  }

  const allowedLabels = [
    "signature of",
    "authorized signature",
    "authorised signature",
    "applicant signature",
    "employee signature",
    "employer signature",
    "client signature",
    "customer signature",
    "witness signature",
    "borrower signature",
    "lender signature",
    "tenant signature",
    "landlord signature",
  ];

  return allowedLabels.some((label) => value === label);
}


export function hasExplicitSignatureLine(text: string): boolean {
  const normalized = normalizeDetectionText(text);

  if (!isSignatureLabel(normalized)) {
    
    const containsSignatureLabel = normalized.includes("signature:");

    if (!containsSignatureLabel) {
      return false;
    }
  }

  
  const hasUnderscoreLine = /_{4,}/.test(text);

  
  const hasDashLine = /-{6,}/.test(text);

  return hasUnderscoreLine || hasDashLine;
}


export function isLikelyIndexEntry(text: string): boolean {
 

  const hasDottedLeader = new RegExp(
    `\\.{${DETECTION_CONFIG.INDEX_DOTTED_LEADER_MIN_LENGTH},}`,
  ).test(text);

  const endsWithPageNumber = new RegExp(
    `\\s\\d{1,${DETECTION_CONFIG.INDEX_MAX_PAGE_NUMBER_DIGITS}}\\s*$`,
  ).test(text);

  return hasDottedLeader && endsWithPageNumber;
}


export function isIndexHeading(text: string): boolean {
  const normalized = normalizeDetectionText(text);

  return (
    normalized === "index" ||
    normalized === "table of contents" ||
    normalized === "contents"
  );
}


export function isDigitalSignatureExplanation(text: string): boolean {
  const normalized = normalizeDetectionText(text);

  if (!normalized.includes("digital signature")) {
    return false;
  }

  
  const explanatoryWords = [
    "verification",
    "verify",
    "technology",
    "method",
    "process",
    "required",
    "means",
    "defined",
    "certificate",
    "authentication",
    "electronic",
    "encrypted",
  ];

  return explanatoryWords.some((word) => normalized.includes(word));
}


export function isNormalParagraph(text: string): boolean {
  const normalized = normalizeDetectionText(text);

  if (!normalized) {
    return false;
  }

  
  const wordCount = normalized.split(/\s+/).length;

  const hasSentencePunctuation = /[.!?]\s*$/.test(text);

  if (wordCount >= 12 && hasSentencePunctuation) {
    return true;
  }

  return false;
}


export function analyzeTextContext(
  item: PdfTextItem,
  nearbyItems: PdfTextItem[] = [],
): TextContextResult {
  const text = item.text;

  const signatureLabel = isSignatureLabel(text);

  const explicitLine = hasExplicitSignatureLine(text);

  const indexEntry = isLikelyIndexEntry(text);

  const indexHeading = isIndexHeading(text);

  const digitalExplanation = isDigitalSignatureExplanation(text);

  const paragraph = isNormalParagraph(text);

  
  const nearbyIndexHeading = nearbyItems.some((candidate) => {
    const samePage = candidate.pageNumber === item.pageNumber;

    if (!samePage) {
      return false;
    }

    const verticalDistance = Math.abs(candidate.y - item.y);

    if (verticalDistance > 250) {
      return false;
    }

    return isIndexHeading(candidate.text);
  });

  const isTableOfContents = indexHeading || nearbyIndexHeading;

  const isIndex = indexHeading || nearbyIndexHeading;

  let scoreModifier = 0;

  const reasons: string[] = [];

  if (signatureLabel) {
    scoreModifier += 20;

    reasons.push("Signature label detected.");
  }

  if (explicitLine) {
    scoreModifier += 40;

    reasons.push("Explicit signature line detected.");
  }

  if (indexEntry) {
    scoreModifier -= 80;

    reasons.push("Looks like an index/table-of-contents entry.");
  }

  if (isIndex) {
    scoreModifier -= 80;

    reasons.push("Index/Table of Contents context detected.");
  }

  if (digitalExplanation) {
    scoreModifier -= 60;

    reasons.push("Digital signature appears in explanatory text.");
  }

  if (paragraph) {
    scoreModifier -= 40;

    reasons.push("Text looks like a normal paragraph.");
  }

  return {
    isTableOfContents,
    isIndex,
    isIndexEntry: indexEntry,
    isNormalParagraph: paragraph,
    isDigitalSignatureExplanation: digitalExplanation,

    isSignatureSection: signatureLabel && !explicitLine,

    isSignatureLabel: signatureLabel,

    isExplicitSignatureLine: explicitLine,

    scoreModifier,

    reasons,
  };
}
