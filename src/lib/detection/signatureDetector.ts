import type { PdfFormField } from "@/lib/pdf/pdfFormFieldExtractor";
import type { PdfTextItem } from "@/types/pdf";
import type { PdfGeometry } from "@/types/pdfGeomatry";
import type { SignatureField } from "@/types/signature";
import { runSignatureDetection } from "./detectionPipeline";

export function detectSignatureFields(
  items: PdfTextItem[],
  geometry?: PdfGeometry,
  formFields: PdfFormField[] = [],
): SignatureField[] {
  return runSignatureDetection(items, geometry, formFields).fields.map(
    (candidate, index) => ({
      id: `signature-${index + 1}`,
      pageNumber: candidate.pageNumber,
      x: candidate.x,
      y: candidate.y,
      width: candidate.width,
      height: candidate.height,
      label: candidate.text || "Signature",
      confidence: candidate.confidence,
      status: "pending",
    }),
  );
}
