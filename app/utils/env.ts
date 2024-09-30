// app/utils/env.ts
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
export const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
export const storageMethod = process.env.STORAGE_METHOD
  ? (process.env.STORAGE_METHOD as "supabase" | "sqlite")
  : "sqlite";

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey);
