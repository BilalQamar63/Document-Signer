import type { PageViewport } from "pdfjs-dist";

import type { SignatureField } from "@/types/signature";

export interface SignaturePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getSignaturePosition(
  viewport: PageViewport,
  field: SignatureField,
): SignaturePosition {
  /*
   * PDF coordinates:
   *
   * bottom-left = origin
   *
   * PDF:
   *
   *       Y
   *       ↑
   *       │
   *       │
   *       └──────────→ X
   *
   * Browser/canvas coordinates:
   *
   *       ┌──────────→ X
   *       │
   *       │
   *       ↓ Y
   *
   * PDF.js handles this conversion for us.
   */

  const [x1, y1] = viewport.convertToViewportPoint(field.x, field.y);

  const [x2, y2] = viewport.convertToViewportPoint(
    field.x + field.width,
    field.y + field.height,
  );

  return {
    left: Math.min(x1, x2),

    top: Math.min(y1, y2),

    width: Math.abs(x2 - x1),

    height: Math.abs(y2 - y1),
  };
}
