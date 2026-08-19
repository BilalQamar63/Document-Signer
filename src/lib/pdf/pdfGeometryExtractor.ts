import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

import type {
  PdfGeometry,
  PdfPageGeometry,
  PdfLine,
  PdfRectangle,
} from "../../types/pdfGeomatry";

/**
 * PDF.js operator constants.
 *
 * We intentionally import them dynamically through
 * the page operator list rather than depending on
 * a specific internal PDF.js implementation.
 */
interface PdfJsOps {
  OPS?: {
    save?: number;
    restore?: number;
    transform?: number;
    moveTo?: number;
    lineTo?: number;
    curveTo?: number;
    rectangle?: number;
    stroke?: number;
    closePath?: number;
  };
}

interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

const IDENTITY_MATRIX: Matrix = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
};

function multiplyMatrices(m1: Matrix, m2: Matrix): Matrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,

    b: m1.b * m2.a + m1.d * m2.b,

    c: m1.a * m2.c + m1.c * m2.d,

    d: m1.b * m2.c + m1.d * m2.d,

    e: m1.a * m2.e + m1.c * m2.f + m1.e,

    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

function transformPoint(matrix: Matrix, x: number, y: number) {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,

    y: matrix.b * x + matrix.d * y + matrix.f,
  };
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Extract geometry from one PDF page.
 *
 * This is intentionally conservative.
 *
 * We only collect:
 *
 * - horizontal lines
 * - vertical lines
 * - rectangles
 *
 * We do NOT assume every line is a signature field.
 */
export async function extractPageGeometry(
  page: PDFPageProxy,
  pageNumber: number,
): Promise<PdfPageGeometry> {
  const viewport = page.getViewport({
    scale: 1,
  });

  const operatorList = await page.getOperatorList();

  /**
   * PDF.js operator constants are available
   * through the OPS export.
   */
  const pdfjsModule = await import("pdfjs-dist");

  const OPS = (pdfjsModule as unknown as PdfJsOps).OPS;

  const lines: PdfLine[] = [];
  const rectangles: PdfRectangle[] = [];

  /**
   * Current transformation matrix.
   */
  let matrix: Matrix = {
    ...IDENTITY_MATRIX,
  };

  /**
   * Saved graphics states.
   */
  const matrixStack: Matrix[] = [];

  /**
   * Current path.
   */
  let currentPath: {
    x: number;
    y: number;
  }[] = [];

  /**
   * PDF.js may encode moveTo/lineTo/stroke
   * differently depending on version.
   *
   * We therefore resolve the operator values
   * defensively.
   */
  const opList = operatorList as unknown as {
    fnArray: number[];
    argsArray: unknown[][];
  };

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i] ?? [];

    /**
     * SAVE
     */
    if (OPS?.save !== undefined && fn === OPS.save) {
      matrixStack.push({
        ...matrix,
      });

      continue;
    }

    /**
     * RESTORE
     */
    if (OPS?.restore !== undefined && fn === OPS.restore) {
      const previous = matrixStack.pop();

      if (previous) {
        matrix = previous;
      }

      continue;
    }

    /**
     * TRANSFORM
     *
     * transform(a,b,c,d,e,f)
     */
    if (OPS?.transform !== undefined && fn === OPS.transform) {
      if (args.length >= 6) {
        const transform: Matrix = {
          a: Number(args[0]),
          b: Number(args[1]),
          c: Number(args[2]),
          d: Number(args[3]),
          e: Number(args[4]),
          f: Number(args[5]),
        };

        matrix = multiplyMatrices(matrix, transform);
      }

      continue;
    }

    /**
     * MOVE TO
     */
    if (OPS?.moveTo !== undefined && fn === OPS.moveTo) {
      if (args.length >= 2) {
        const point = transformPoint(matrix, Number(args[0]), Number(args[1]));

        currentPath = [point];
      }

      continue;
    }

    /**
     * LINE TO
     */
    if (OPS?.lineTo !== undefined && fn === OPS.lineTo) {
      if (args.length >= 2) {
        const point = transformPoint(matrix, Number(args[0]), Number(args[1]));

        if (currentPath.length > 0) {
          const previous = currentPath[currentPath.length - 1];

          const x1 = previous.x;
          const y1 = previous.y;

          const x2 = point.x;
          const y2 = point.y;

          const width = Math.abs(x2 - x1);

          const height = Math.abs(y2 - y1);

          const length = distance(x1, y1, x2, y2);

          /**
           * Horizontal line.
           */
          if (height <= 2 && width >= 20) {
            lines.push({
              pageNumber,
              x1,
              y1,
              x2,
              y2,
              width,
              height,
              length,
              orientation: "horizontal",
              source: "pdf-lineTo",
            });
          }

          /**
           * Vertical line.
           */
          if (width <= 2 && height >= 20) {
            lines.push({
              pageNumber,
              x1,
              y1,
              x2,
              y2,
              width,
              height,
              length,
              orientation: "vertical",
              source: "pdf-lineTo",
            });
          }
        }

        currentPath.push(point);
      }

      continue;
    }

    /**
     * RECTANGLE
     *
     * rectangle(x, y, width, height)
     */
    if (OPS?.rectangle !== undefined && fn === OPS.rectangle) {
      if (args.length >= 4) {
        const x = Number(args[0]);

        const y = Number(args[1]);

        const width = Number(args[2]);

        const height = Number(args[3]);

        const p1 = transformPoint(matrix, x, y);

        const p2 = transformPoint(matrix, x + width, y + height);

        rectangles.push({
          pageNumber,
          x: Math.min(p1.x, p2.x),
          y: Math.min(p1.y, p2.y),
          width: Math.abs(p2.x - p1.x),
          height: Math.abs(p2.y - p1.y),
          source: "pdf-rectangle",
        });
      }

      continue;
    }

    /**
     * STROKE / CLOSE PATH
     *
     * We intentionally don't create
     * additional geometry here.
     *
     * The line itself has already been
     * collected from lineTo().
     */
    if (OPS?.stroke !== undefined && fn === OPS.stroke) {
      continue;
    }

    if (OPS?.closePath !== undefined && fn === OPS.closePath) {
      continue;
    }
  }

  /**
   * Remove very tiny / accidental lines.
   */
  const filteredLines = lines.filter((line) => line.length >= 20);

  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    lines: filteredLines,
    rectangles,
  };
}

/**
 * Extract geometry for the entire PDF.
 */
export async function extractPdfGeometry(
  pdf: PDFDocumentProxy,
): Promise<PdfGeometry> {
  const pages: PdfPageGeometry[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const geometry = await extractPageGeometry(page, pageNumber);

    pages.push(geometry);
  }

  return {
    pages,
  };
}
