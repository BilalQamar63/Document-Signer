import type { PdfTextItem } from "@/types/pdf";
import { analyzeTextContext, normalizeDetectionText } from "./contextAnalyzer";

export function findSignatureSections(items: PdfTextItem[]): PdfTextItem[] {
  return items.filter((item) => {
    const text = normalizeDetectionText(item.text);
    const context = analyzeTextContext(item, items);
    return (
      (text === "signatures" || text === "signatures:") &&
      !context.isIndex &&
      !context.isIndexEntry &&
      !context.isDigitalSignatureExplanation
    );
  });
}
export function itemsBelowSection(
  section: PdfTextItem,
  items: PdfTextItem[],
  distance: number,
): PdfTextItem[] {
  return items.filter(
    (item) =>
      item.pageNumber === section.pageNumber &&
      item.y < section.y &&
      section.y - item.y <= distance,
  );
}
