"use client";

import { useEffect, useRef, useState } from "react";

import { CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

import { loadPdf } from "@/lib/pdf/pdfLoader";

import type { SignatureField } from "@/types/signature";

import PdfPage from "./PdfPage";
import PdfZoomControls, {
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_LEVELS,
} from "./PdfZoomControls";

/**
 * Zoom is expressed relative to the "fit width" baseline.
 *
 * "fit-width" -> always tracks the container width (100%).
 * "fit-page"  -> tracks the available viewport height.
 * "custom"    -> a fixed percentage the user picked via +/-.
 */
type ZoomMode = "fit-width" | "fit-page" | "custom";

/*
 * Rough vertical space already used by the sticky header,
 * zoom toolbar, and page padding. Used only to estimate a
 * sensible "fit page" scale; not pixel-perfect by design.
 */
const FIT_PAGE_VERTICAL_ALLOWANCE = 220;

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

const ZoomToolbar = styled("div")(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 80,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(1, 0),
  backgroundColor: "#e5e7eb",
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
  const viewerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);

  /*
   * "fitWidthScale" is the scale at which the first page's
   * width matches the available container width. It is the
   * 100% baseline that all zoom percentages are relative to.
   */
  const [fitWidthScale, setFitWidthScale] = useState(1);

  /*
   * First page dimensions at scale 1, used to derive both
   * fitWidthScale and fitPageScale without re-fetching the
   * page on every resize/zoom change.
   */
  const [basePageSize, setBasePageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit-width");
  const [zoomPercentage, setZoomPercentage] = useState(100);

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

  /*
   * Reset zoom whenever a new document is loaded so that a
   * previous document's zoom level doesn't carry over.
   */
  useEffect(() => {
    setZoomMode("fit-width");
    setZoomPercentage(100);
    setBasePageSize(null);
  }, [pdf]);

  useEffect(() => {
    if (!pdf || !viewerRef.current) {
      return;
    }

    let cancelled = false;
    const loadedPdf = pdf;

    async function updateFitWidthScale() {
      const firstPage = await loadedPdf.getPage(1);

      if (cancelled || !viewerRef.current) {
        return;
      }

      const baseViewport = firstPage.getViewport({ scale: 1 });

      setBasePageSize((current) =>
        current ?? { width: baseViewport.width, height: baseViewport.height },
      );

      const availableWidth = viewerRef.current.clientWidth;
      const pageWidth = Math.min(availableWidth, 900);

      if (baseViewport.width > 0 && pageWidth > 0) {
        setFitWidthScale(pageWidth / baseViewport.width);
      }
    }

    const observer = new ResizeObserver(() => {
      void updateFitWidthScale();
    });

    observer.observe(viewerRef.current);
    void updateFitWidthScale();

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdf]);

  /*
   * Effective render scale, derived from zoom mode.
   *
   * IMPORTANT: this is the single source of truth for the
   * scale passed to every page. Because signature overlay
   * position is recomputed from each page's live viewport
   * (see coordinateMapper.ts), changing this value alone is
   * enough to keep signatures perfectly aligned at any zoom.
   */
  const scale =
    zoomMode === "fit-page" &&
    basePageSize &&
    basePageSize.height > 0 &&
    typeof window !== "undefined"
      ? Math.max(
          0.1,
          (window.innerHeight - FIT_PAGE_VERTICAL_ALLOWANCE) /
            basePageSize.height,
        )
      : fitWidthScale * (zoomPercentage / 100);

  const effectiveZoomPercentage =
    zoomMode === "fit-page" && fitWidthScale > 0
      ? (scale / fitWidthScale) * 100
      : zoomPercentage;

  function handleZoomIn() {
    const next = ZOOM_LEVELS.find((level) => level > effectiveZoomPercentage);

    setZoomMode("custom");
    setZoomPercentage(next ?? MAX_ZOOM);
  }

  function handleZoomOut() {
    const next = [...ZOOM_LEVELS]
      .reverse()
      .find((level) => level < effectiveZoomPercentage);

    setZoomMode("custom");
    setZoomPercentage(next ?? MIN_ZOOM);
  }

  function handleFitWidth() {
    setZoomMode("fit-width");
    setZoomPercentage(100);
  }

  function handleFitPage() {
    setZoomMode("fit-page");
  }

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
      <ZoomToolbar>
        <PdfZoomControls
          zoomPercentage={effectiveZoomPercentage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitWidth={handleFitWidth}
          onFitPage={handleFitPage}
        />
      </ZoomToolbar>

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
