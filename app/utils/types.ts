// app/utils/types.ts
export interface StoredHighlight {
  id: string;
  pdfId: string;
  pageNumber: number;
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

export enum StorageMethod {
  supabase = "supabase",
  sqlite = "sqlite",
}