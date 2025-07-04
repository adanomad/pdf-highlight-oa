// app/utils/env.ts
export const supabaseUrl = process.env.SUPABASE_URL as string;
export const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
export const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
export const storageMethod = process.env.STORAGE_METHOD
  ? (process.env.STORAGE_METHOD as "supabase" | "sqlite")
  : "sqlite";
export const googleApiKey = process.env.GOOGLE_API_KEY as string;
export const openAiKey = process.env.OPEN_AI_KEY as string;