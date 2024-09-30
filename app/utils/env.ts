// app/utils/env.ts
export const supabaseUrl = process.env.SUPABASE_URL as string;
export const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
export const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
export const storageMethod = process.env.STORAGE_METHOD
  ? (process.env.STORAGE_METHOD as "supabase" | "sqlite")
  : "sqlite";
export const debugOcrPdfEnabled = process.env.NEXT_PUBLIC_DEBUG_OCRPDF_ENABLED
  ? (["true", "True", "1", "TRUE"].includes(process.env.NEXT_PUBLIC_DEBUG_OCRPDF_ENABLED as string))
  : true;
export const debugMultiSearchEnabled = process.env.NEXT_PUBLIC_DEBUG_MULTISEARCH_ENABLED
  ? (["true", "True", "1", "TRUE"].includes(process.env.NEXT_PUBLIC_DEBUG_MULTISEARCH_ENABLED as string))
  : true;