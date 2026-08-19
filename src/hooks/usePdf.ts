"use client";

import { useEffect, useState } from "react";

import type { PDFDocumentProxy } from "pdfjs-dist";

import { loadPdf } from "@/lib/pdf/pdfLoader";

import { extractPdfText } from "@/lib/pdf/pdfTextExtractor";
import { extractPdfGeometry } from "@/lib/pdf/pdfGeometryExtractor";
import { extractPdfSignatureFields } from "@/lib/pdf/pdfFormFieldExtractor";

import { detectSignatureFields } from "@/lib/detection/signatureDetector";

import type { PdfTextItem } from "@/types/pdf";
import type { SignatureField } from "@/types/signature";

interface UsePdfResult {
  pdf: PDFDocumentProxy | null;
  textItems: PdfTextItem[];
  signatureFields: SignatureField[];
  loading: boolean;
  error: string | null;
}

export function usePdf(file: File | null): UsePdfResult {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);

  const [textItems, setTextItems] = useState<PdfTextItem[]>([]);

  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdf(null);
      setTextItems([]);
      setSignatureFields([]);
      return;
    }

    let cancelled = false;

    async function processPdf() {
      try {
        setLoading(true);
        setError(null);

        const currentFile = file;

        if (!currentFile) {
          return;
        }

        const loadedPdf = await loadPdf(currentFile);

        if (cancelled) return;

        setPdf(loadedPdf);

        const items = await extractPdfText(loadedPdf);

        if (cancelled) return;

        setTextItems(items);

        const [geometry, formFields] = await Promise.all([
          extractPdfGeometry(loadedPdf),
          extractPdfSignatureFields(loadedPdf),
        ]);

        if (cancelled) return;

        const fields = detectSignatureFields(items, geometry, formFields);

        if (cancelled) return;

        setSignatureFields(fields);
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to analyze this PDF.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    processPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return {
    pdf,
    textItems,
    signatureFields,
    loading,
    error,
  };
}
