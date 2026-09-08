import type { PDFDocumentProxy } from "pdfjs-dist";

export interface PdfFormField {
  pageNumber: number;

  name: string;

  type: string;

  x: number;
  y: number;

  width: number;
  height: number;

  fieldType?: string;

  isSignatureField: boolean;

  raw?: unknown;
}

export async function extractPdfFormFields(
  pdf: PDFDocumentProxy,
): Promise<PdfFormField[]> {
  const fields: PdfFormField[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const annotations = await page.getAnnotations({
      intent: "display",
    });

    for (const annotation of annotations) {
      const rect = annotation.rect;

      if (!Array.isArray(rect) || rect.length < 4) {
        continue;
      }

      const x1 = Number(rect[0]);

      const y1 = Number(rect[1]);

      const x2 = Number(rect[2]);

      const y2 = Number(rect[3]);

      const x = Math.min(x1, x2);

      const y = Math.min(y1, y2);

      const width = Math.abs(x2 - x1);

      const height = Math.abs(y2 - y1);

      const fieldType = String(
        annotation.fieldType ?? annotation.subtype ?? "",
      ).toLowerCase();

      const name = String(
        annotation.fieldName ?? annotation.fullName ?? annotation.name ?? "",
      );

      const isSignatureField =
        fieldType.includes("sig") ||
        (String(annotation.subtype ?? "").toLowerCase() === "widget" &&
          (name.toLowerCase().includes("signature") ||
            name.toLowerCase().includes("sign")));

      fields.push({
        pageNumber,

        name,

        type: String(annotation.subtype ?? ""),

        x,
        y,
        width,
        height,

        fieldType,

        isSignatureField,

        raw: annotation,
      });
    }
  }

  return fields;
}

export async function extractPdfSignatureFields(
  pdf: PDFDocumentProxy,
): Promise<PdfFormField[]> {
  const fields = await extractPdfFormFields(pdf);

  return fields.filter((field) => field.isSignatureField);
}
