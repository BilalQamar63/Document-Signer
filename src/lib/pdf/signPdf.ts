import { PDFDocument } from "pdf-lib";

import type { SignatureField } from "@/types/signature";

export async function signPdf(
  file: File,
  signatureFields: SignatureField[],
): Promise<Uint8Array> {
  const originalBytes = await file.arrayBuffer();

  const pdfDoc = await PDFDocument.load(originalBytes);

  const pages = pdfDoc.getPages();

  for (const field of signatureFields) {
    if (field.status !== "signed" || !field.signatureDataUrl) {
      continue;
    }

    const page = pages[field.pageNumber - 1];

    if (!page) {
      console.warn(`PDF page ${field.pageNumber} does not exist.`);

      continue;
    }

    const signatureBytes = dataUrlToUint8Array(field.signatureDataUrl);

    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    page.drawImage(signatureImage, {
      x: field.x,

    //   y: field.y - field.height,
      y: field.y,

      width: field.width,

      height: field.height,
    });
  }

  return pdfDoc.save();
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    throw new Error("Invalid signature image.");
  }

  const binaryString = atob(base64);

  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
