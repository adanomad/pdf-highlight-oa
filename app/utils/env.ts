// app/utils/env.ts

const isServer = typeof window === "undefined";

// Public (browser) vars — only NEXT_PUBLIC_* are exposed client-side
export const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Server vars (never expose these in client bundles)
export const SUPABASE_URL = process.env.SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// Service role key: server-only
export const SUPABASE_SERVICE_ROLE_KEY = isServer
  ? process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  : "";

// Friendly lower-case exports used by your code
export const supabaseUrl = isServer
  ? SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL
  : NEXT_PUBLIC_SUPABASE_URL;

export const supabaseKey = isServer
  ? SUPABASE_ANON_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY
  : NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseServiceKey = SUPABASE_SERVICE_ROLE_KEY;

// Storage method (readable both sides)
export const storageMethod = (
  process.env.NEXT_PUBLIC_STORAGE_METHOD ??
  process.env.STORAGE_METHOD ??
  "sqlite"
) as "sqlite" | "supabase";
