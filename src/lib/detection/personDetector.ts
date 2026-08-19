import type { PdfTextItem } from "@/types/pdf";
import { findSignatureKeyword } from "./signatureKeywords";
const NAME_LABELS = ["name", "full name", "printed name", "print name"];
export function looksLikePersonName(text: string): boolean {
  const cleaned = text.trim(); const lower = cleaned.toLowerCase(); const words = cleaned.split(/\s+/);
  return Boolean(cleaned) && !findSignatureKeyword(lower) && !NAME_LABELS.some((label) => lower.startsWith(label)) && words.length >= 2 && words.length <= 5 && words.every((word) => /^(?:mr|mrs|ms|miss|dr)\.?$|^[A-Za-z][A-Za-z.,'-]*$/.test(word));
}
export function findPeople(items: PdfTextItem[]): PdfTextItem[] { return items.filter((item) => looksLikePersonName(item.text)); }
