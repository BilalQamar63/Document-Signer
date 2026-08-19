import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

import type { PdfTextItem } from "@/types/pdf";

interface PdfJsTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export async function extractPdfText(
  pdf: PDFDocumentProxy,
): Promise<PdfTextItem[]> {
  const results: PdfTextItem[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const items = await extractPageText(page, pageNumber);

    results.push(...items);
  }

  return results;
}

async function extractPageText(
  page: PDFPageProxy,
  pageNumber: number,
): Promise<PdfTextItem[]> {
  const textContent = await page.getTextContent();

  const items: PdfTextItem[] = [];

  for (const item of textContent.items) {
    if (!isTextItem(item)) {
      continue;
    }

    const [, , , scaleY, x, y] = item.transform;

    items.push({
      text: item.str.trim(),
      x,
      y,
      width: item.width,
      height: Math.abs(scaleY) || item.height,
      pageNumber,
    });
  }

  return items;
}

function isTextItem(item: unknown): item is PdfJsTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof item.str === "string" &&
    "transform" in item &&
    Array.isArray(item.transform) &&
    "width" in item &&
    typeof item.width === "number" &&
    "height" in item &&
    typeof item.height === "number"
  );
}
