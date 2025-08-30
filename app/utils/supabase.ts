// app/utils/supabase.ts
// Server-only: do NOT import this from client components

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceKey } from "./env";
import { StoredHighlight } from "./types";

const client = () => createClient(supabaseUrl, supabaseServiceKey);

type DBRow = {
  id: string;
  pdf_id: string;
  data: StoredHighlight; // we store the full app shape here
  created_at?: string;
  updated_at?: string;
};

// Map DB -> app (ensure id/pdfId present even if not in data)
const fromDB = (r: DBRow): StoredHighlight => {
  const base = r.data || ({} as StoredHighlight);
  return {
    ...base,
    id: r.id ?? base.id,
    pdfId: r.pdf_id ?? (base as any).pdfId,
  };
};

// Map app -> DB
const toDB = (h: StoredHighlight): DBRow => ({
  id: h.id,
  pdf_id: (h as any).pdfId,
  data: h,
});

export async function dbGetHighlightsByPdfId(pdfId: string): Promise<StoredHighlight[]> {
  const { data, error } = await client()
    .from("highlights")
    .select("id,pdf_id,data,created_at,updated_at")
    .eq("pdf_id", pdfId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DBRow[] | null)?.map(fromDB) ?? [];
}

export async function dbReplaceHighlightsForPdfId(
  pdfId: string,
  highlights: StoredHighlight[]
) {
  const c = client();
  const { error: delErr } = await c.from("highlights").delete().eq("pdf_id", pdfId);
  if (delErr) throw delErr;
  if (!highlights?.length) return true;

  const rows = highlights.map(toDB);
  const { error: insErr } = await c.from("highlights").insert(rows);
  if (insErr) throw insErr;
  return true;
}

export async function dbUpsertHighlights(highlights: StoredHighlight[]) {
  if (!highlights?.length) return true;
  const rows = highlights.map(toDB);
  const { error } = await client()
    .from("highlights")
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
  return true;
}
