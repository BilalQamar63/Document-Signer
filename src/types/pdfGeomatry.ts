export type PdfLineOrientation = "horizontal" | "vertical";

export interface PdfLine {
  pageNumber: number;

  /**
   * PDF coordinate system:
   * origin is bottom-left.
   */
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  width: number;
  height: number;

  /**
   * Length of the line.
   */
  length: number;

  orientation: PdfLineOrientation;

  /**
   * Original PDF.js operator information.
   * Useful for debugging.
   */
  source?: string;
}

export interface PdfRectangle {
  pageNumber: number;

  x: number;
  y: number;

  width: number;
  height: number;

  source?: string;
}

export interface PdfPageGeometry {
  pageNumber: number;

  width: number;
  height: number;

  lines: PdfLine[];
  rectangles: PdfRectangle[];
}

export interface PdfGeometry {
  pages: PdfPageGeometry[];
}
