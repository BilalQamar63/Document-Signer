"use client";

import { useEffect, useRef, useState } from "react";

import { CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

import { loadPdf } from "@/lib/pdf/pdfLoader";

import type { SignatureField } from "@/types/signature";

import PdfPage from "./PdfPage";

const ViewerRoot = styled("div")(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2, 0),
  overflowX: "hidden",
  backgroundColor: "#e5e7eb",
  [theme.breakpoints.up("sm")]: {
    gap: theme.spacing(3),
    padding: theme.spacing(3, 0),
  },
}));

const LoadingState = styled("div")(({ theme }) => ({
  minHeight: 240,
  display: "grid",
  placeItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(3),
}));

interface PdfViewerProps {
  file: File;
  signatureFields: SignatureField[];
  onSignatureClick: (field: SignatureField) => void;
}

export default function PdfViewer({
  file,
  signatureFields,
  onSignatureClick,
}: PdfViewerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const document = await loadPdf(file);

        if (!cancelled) {
          setPdf(document);
        }
      } catch (error) {
        console.error("Failed to load PDF:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pdf || !viewerRef.current) {
      return;
    }

    let cancelled = false;
    const loadedPdf = pdf;

    async function updateScale() {
      const firstPage = await loadedPdf.getPage(1);

      if (cancelled || !viewerRef.current) {
        return;
      }

      const availableWidth = viewerRef.current.clientWidth;
      const baseWidth = firstPage.getViewport({ scale: 1 }).width;
      const pageWidth = Math.min(availableWidth, 900);

      if (baseWidth > 0 && pageWidth > 0) {
        setScale(pageWidth / baseWidth);
      }
    }

    const observer = new ResizeObserver(() => {
      void updateScale();
    });

    observer.observe(viewerRef.current);
    void updateScale();

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdf]);

  if (loading) {
    return (
      <LoadingState>
        <CircularProgress aria-label="Loading PDF" />
        <Typography>Loading PDF...</Typography>
      </LoadingState>
    );
  }

  if (!pdf) {
    return (
      <LoadingState>
        <Typography>Unable to load PDF.</Typography>
      </LoadingState>
    );
  }

  return (
    <ViewerRoot ref={viewerRef}>
      {Array.from(
        {
          length: pdf.numPages,
        },
        (_, index) => index + 1,
      ).map((pageNumber) => (
        <PdfPageItem
          key={pageNumber}
          pdf={pdf}
          pageNumber={pageNumber}
          signatureFields={signatureFields}
          scale={scale}
          onSignatureClick={onSignatureClick}
        />
      ))}
    </ViewerRoot>
  );
}

interface PdfPageItemProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  signatureFields: SignatureField[];
  scale: number;
  onSignatureClick: (field: SignatureField) => void;
}

function PdfPageItem({
  pdf,
  pageNumber,
  signatureFields,
  scale,
  onSignatureClick,
}: PdfPageItemProps) {
  const [page, setPage] = useState<PDFPageProxy | null>(null);

  useEffect(() => {
    let cancelled = false;

    pdf.getPage(pageNumber).then((result) => {
      if (!cancelled) {
        setPage(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  if (!page) {
    return (
      <div
        style={{
          width: "min(100%, 900px)",
          aspectRatio: "0.707",
          background: "#fff",
        }}
      />
    );
  }

  return (
    <PdfPage
      page={page}
      pageNumber={pageNumber}
      signatureFields={signatureFields}
      scale={scale}
      onSignatureClick={onSignatureClick}
    />
  );
}
