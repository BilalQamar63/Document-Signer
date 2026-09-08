export type PdfLineOrientation = "horizontal" | "vertical";

export interface PdfLine {
  pageNumber: number;

  x1: number;
  y1: number;
  x2: number;
  y2: number;

  width: number;
  height: number;

  length: number;

  orientation: PdfLineOrientation;

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
