// app/utils/types.ts
export interface StoredHighlight {
  pdfId: string;
  pageNumber: number;
  lineNumber?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  text: string;
  image?: string;
  keyword: string;
}

export interface StoredPdf {
  id: string;
  name: string;
  numPages: number;
  url: string;
}

export interface PdfLocation {
  pdf?: StoredPdf;
  pageNumber?: number;
  lineNumber?: number;
  storedHighlight?: StoredHighlight;
}

export interface SearchResult {
  pdfPage: PdfLocation;
  id: number,
  distance: number,
}

export interface ResultAndHighlight {
  result: SearchResult;
  highlight: StoredHighlight;
}

export enum StorageMethod {
  supabase = "supabase",
  sqlite = "sqlite",
}

export interface StoredImage {
  image: string;
  width: number;
  height: number;
}
