import type { PDFDocumentProxy } from "pdfjs-dist";

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await getDocument({
    data: arrayBuffer,
  }).promise;

  return pdf;
}
