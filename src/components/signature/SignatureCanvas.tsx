"use client";

import { useEffect, useRef } from "react";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

const CanvasRoot = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: 180,
  border: "1px solid #d1d5db",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  overflow: "hidden",
  [theme.breakpoints.up("sm")]: {
    height: 220,
  },
}));

const DrawingCanvas = styled("canvas")({
  width: "100%",
  height: "100%",
  display: "block",
  touchAction: "none",
  cursor: "crosshair",
});

const SignatureLine = styled("div")(({ theme }) => ({
  position: "absolute",
  left: theme.spacing(2),
  right: theme.spacing(2),
  bottom: 32,
  borderBottom: "1px solid #9ca3af",
  pointerEvents: "none",
  [theme.breakpoints.up("sm")]: {
    left: theme.spacing(3),
    right: theme.spacing(3),
    bottom: 35,
  },
}));

const SignatureHint = styled("span")(({ theme }) => ({
  position: "absolute",
  left: theme.spacing(2),
  bottom: 8,
  fontSize: 11,
  color: theme.palette.text.secondary,
  pointerEvents: "none",
  [theme.breakpoints.up("sm")]: {
    left: theme.spacing(3),
    bottom: 10,
    fontSize: 12,
  },
}));

interface SignatureCanvasProps {
  onChange?: (dataUrl: string | null) => void;
}

export default function SignatureCanvas({
  onChange,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      return;
    }

    const canvas = canvasElement as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    if (!ctx) {
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#111827";

    function getPoint(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    }

    function handlePointerDown(event: PointerEvent) {
      event.preventDefault();
      drawingRef.current = true;

      canvas.setPointerCapture(event.pointerId);

      const point = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!drawingRef.current) {
        return;
      }

      event.preventDefault();

      const point = getPoint(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    function handlePointerUp(event: PointerEvent) {
      if (!drawingRef.current) {
        return;
      }

      drawingRef.current = false;

      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture may already have been released.
      }

      onChange?.(canvas.toDataURL("image/png"));
    }

    function handlePointerCancel(event: PointerEvent) {
      drawingRef.current = false;

      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore pointer cleanup errors.
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      drawingRef.current = false;
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [onChange]);

  function clear() {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      return;
    }

    const context = canvasElement.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      canvasElement.width,
      canvasElement.height,
    );

    drawingRef.current = false;

    onChange?.(null);
  }

  return (
    <div>
      <CanvasRoot>
        <DrawingCanvas
          ref={canvasRef}
          width={1400}
          height={440}
        />
        <SignatureLine />
        <SignatureHint>
          Draw your signature here
        </SignatureHint>
      </CanvasRoot>

      <Button
        type="button"
        onClick={clear}
        variant="outlined"
        color="inherit"
        sx={{ mt: 1.5 }}
      >
        Clear
      </Button>
    </div>
  );
}