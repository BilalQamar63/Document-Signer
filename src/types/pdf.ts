export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PdfDocumentInfo {
  file: File;
  pageCount: number;
  pages: PdfPageInfo[];
}

export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}
