"use client";

import { useEffect, useRef, useState } from "react";

import { styled } from "@mui/material/styles";

import type { PDFPageProxy } from "pdfjs-dist";

import type { SignatureField } from "@/types/signature";

import { getSignaturePosition } from "@/lib/pdf/coordinateMapper";

interface PositionProps {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CanvasSizeProps {
  cssWidth?: number;
  cssHeight?: number;
}

const PageSurface = styled("div")(({ theme }) => ({
  position: "relative",
  display: "inline-block",
  maxWidth: "100%",
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
}));

const PdfCanvas = styled("canvas", {
  shouldForwardProp: (prop) => !["cssWidth", "cssHeight"].includes(prop as string),
})<CanvasSizeProps>(({ cssWidth, cssHeight }) => ({
  display: "block",
  width: cssWidth ? `${cssWidth}px` : "auto",
  height: cssHeight ? `${cssHeight}px` : "auto",
  maxWidth: "100%",
}));

const OverlayBox = styled("div", {
  shouldForwardProp: (prop) =>
    !["left", "top", "width", "height"].includes(prop as string),
})<PositionProps>(({ left, top, width, height }) => ({
  position: "absolute",
  left,
  top,
  width,
  height,
  zIndex: 20,
  overflow: "hidden",
}));

const MarkerButton = styled("button", {
  shouldForwardProp: (prop) =>
    !["left", "top", "width", "height"].includes(prop as string),
})<PositionProps>(({ theme, left, top, width, height }) => ({
  position: "absolute",
  left,
  top,
  width,
  height,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(0.5),
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  background: "rgba(37, 99, 235, 0.08)",
  color: theme.palette.primary.main,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.2,
  [theme.breakpoints.down("sm")]: {
    fontSize: 10,
    padding: theme.spacing(0.25),
  },
}));

const SignatureImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
  userSelect: "none",
});

const ResignButton = styled("button")(({ theme }) => ({
  position: "absolute",
  right: 2,
  bottom: 2,
  maxWidth: "calc(100% - 4px)",
  padding: theme.spacing(0.5, 1),
  border: 0,
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.2,
  cursor: "pointer",
  boxShadow: theme.shadows[2],
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0.35, 0.5),
    fontSize: 9,
  },
}));

interface PdfPageProps {
  page: PDFPageProxy;
  pageNumber: number;
  signatureFields: SignatureField[];
  scale?: number;
  onSignatureClick: (field: SignatureField) => void;
}

export default function PdfPage({
  page,
  pageNumber,
  signatureFields,
  scale = 1.25,
  onSignatureClick,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderTaskRef = useRef<ReturnType<PDFPageProxy["render"]> | null>(null);

  const [viewport, setViewport] = useState<ReturnType<
    PDFPageProxy["getViewport"]
  > | null>(null);

  const [canvasSize, setCanvasSize] = useState<CanvasSizeProps>({});

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let cancelled = false;

    async function renderPage(canvasElement: HTMLCanvasElement) {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Already cancelled/completed.
        }

        renderTaskRef.current = null;
      }

      try {
        const nextViewport = page.getViewport({
          scale,
        });

        const context = canvasElement.getContext("2d");

        if (!context) {
          throw new Error("Unable to get canvas context");
        }

        const outputScale = window.devicePixelRatio || 1;

        canvasElement.width = Math.floor(nextViewport.width * outputScale);

        canvasElement.height = Math.floor(nextViewport.height * outputScale);

        setViewport(nextViewport);
        setCanvasSize({
          cssWidth: nextViewport.width,
          cssHeight: nextViewport.height,
        });

        const renderTask = page.render({
          canvas: canvasElement,
          canvasContext: context,
          viewport: nextViewport,
          transform:
            outputScale === 1
              ? undefined
              : [outputScale, 0, 0, outputScale, 0, 0],
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "RenderingCancelledException"
        ) {
          return;
        }

        if (!cancelled) {
          console.error("Failed to render PDF page:", error);
        }
      } finally {
        renderTaskRef.current = null;
      }
    }

    renderPage(canvas);

    return () => {
      cancelled = true;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Already cancelled/completed.
        }

        renderTaskRef.current = null;
      }
    };
  }, [page, scale]);

  const pageFields = signatureFields.filter(
    (field) => field.pageNumber === pageNumber,
  );

  return (
    <PageSurface>
      <PdfCanvas
        ref={canvasRef}
        cssWidth={canvasSize.cssWidth}
        cssHeight={canvasSize.cssHeight}
      />

      {viewport &&
        pageFields.map((field) => (
          <SignatureOverlay
            key={field.id}
            field={field}
            viewport={viewport}
            onClick={onSignatureClick}
          />
        ))}
    </PageSurface>
  );
}

interface SignatureMarkerProps {
  field: SignatureField;
  viewport: ReturnType<PDFPageProxy["getViewport"]>;
  onClick: (field: SignatureField) => void;
}

function SignatureMarker({ field, viewport, onClick }: SignatureMarkerProps) {
  const position = getSignaturePosition(viewport, field);

  return (
    <MarkerButton
      type="button"
      onClick={() => onClick(field)}
      left={position.left}
      top={position.top}
      width={position.width}
      height={position.height}
    >
      Sign here
    </MarkerButton>
  );
}

interface SignatureOverlayProps {
  field: SignatureField;

  viewport: ReturnType<PDFPageProxy["getViewport"]>;

  onClick: (field: SignatureField) => void;
}

function SignatureOverlay({ field, viewport, onClick }: SignatureOverlayProps) {
  const position = getSignaturePosition(viewport, field);

  /*
   * Signed field
   */
  if (field.status === "signed" && field.signatureDataUrl) {
    return (
      <OverlayBox
        left={position.left}
        top={position.top}
        width={position.width}
        height={position.height}
      >
        {/* Signature */}
        <SignatureImage
          src={field.signatureDataUrl}
          alt="Signed signature"
          draggable={false}
        />

        {/* Re-sign button */}
        <ResignButton
          type="button"
          onClick={() => onClick(field)}
          title="Change this signature"
        >
          Re-sign
        </ResignButton>
      </OverlayBox>
    );
  }

  /*
   * Pending field
   */
  return (
    <MarkerButton
      type="button"
      onClick={() => onClick(field)}
      left={position.left}
      top={position.top}
      width={position.width}
      height={position.height}
    >
      Sign here
    </MarkerButton>
  );
}
