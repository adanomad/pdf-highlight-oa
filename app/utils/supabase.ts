// app/utils/supabase.ts
import { createClient } from "@supabase/supabase-js";
// import { supabaseKey, supabaseUrl } from "./env";
import { StoredHighlight } from "./types";
import fs from "fs";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabaseKey = supabaseServiceKey ?? supabaseAnonKey;

export const supabaseServer = () => createClient(supabaseUrl, supabaseKey);

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey, {
  auth: { persistSession: false },
});

export const saveHighlight = async (highlight: StoredHighlight) => {
  const { error } = await supabaseAdmin.from("highlights").insert(highlight);
  if (error) throw error;
  return null;
};

export const saveBulkHighlights = async (highlights: StoredHighlight[]) => {
  const { error } = await supabaseAdmin.from("highlights").upsert(highlights);
  if (error) throw error;
  return null;
};

export const getHighlightsForPdf = async (pdfId: string) => {
  const { data, error } = await supabaseAdmin
    .from("highlights")
    .select()
    .eq("pdfId", pdfId);

  if (error) throw error;
  return data && data.length > 0 ? data : null;
};

export const updateHighlight = async (
  id: string,
  updatedData: Partial<StoredHighlight>
) => {
  const { error } = await supabaseAdmin
    .from("highlights")
    .update(updatedData)
    .eq("id", id);
  if (error) throw error;
  return null;
};

export const deleteHighlight = async (id: string) => {
  const { error } = await supabaseAdmin
    .from("highlights")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return null;
};

// UPLOAD
export const uploadToSupabase = async (file: File): Promise<string | null> => {
  const path = `pdf/${file.name}`;
  const { error } = await supabaseAdmin.storage
    .from("pdf_bucket")
    .upload(path, file, {
      upsert: true,
      cacheControl: "0",
      contentType: "application/pdf",
    });

  if (error) {
    console.error("Supabase upload error:", error.message);
    return null;
  }

  const { data } = supabaseAdmin.storage.from("pdf_bucket").getPublicUrl(path);
  return data.publicUrl;
};

// LIST
export const getDocumentsFromSupabase = async () => {
  const { data, error } = await supabaseAdmin.storage
    .from("pdf_bucket")
    .list("pdf", { limit: 100 });

  if (error) {
    console.error("Supabase list error:", error.message);
    return [];
  }

  const filtered = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
  return filtered.map((f) => ({
    id: f.name,
    name: f.name,
    url: `${process.env.SUPABASE_URL}/storage/v1/object/public/pdf_bucket/pdf/${f.name}`,
  }));
};

// DELETE
export const deleteDocumentFromSupabase = async (filename: string) => {
  const { error } = await supabaseAdmin.storage
    .from("pdf_bucket")
    .remove([`pdf/${filename}`]);
  if (error) throw new Error(error.message);
};

// Ensure the vector we send to Postgres is 1-D numeric
function to1D(vec: any): number[] {
  const arr = Array.isArray(vec?.[0]) ? vec[0] : vec; // unwrap [[...]] if present
  if (!Array.isArray(arr)) throw new Error("query vector must be an array");
  const flat = arr.map((x: any) => Number(x));
  if (flat.some((x) => !Number.isFinite(x))) {
    throw new Error("query vector contains non-finite numbers");
  }
  return flat;
}

type MatchKind = 'image' | 'text' | null;

export async function upsertDocument(name: string, url: string) {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  // Try by (name,url) combo; change matching if you prefer by name only
  const existing = await supabaseClient
    .from('documents')
    .select('id')
    .eq('name', name)
    .eq('url', url)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  const { data, error } = await supabaseClient
    .from('documents')
    .insert({ name, url })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function ensurePages(documentId: string, pageCount: number) {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const { error } = await supabaseClient
      .from('pages')
      .upsert({ document_id: documentId, page_number: pageNumber }, { onConflict: 'document_id,page_number' });
    if (error) throw new Error(error.message);
  }
}

export async function getPageId(documentId: string, pageNumber: number) {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabaseClient
    .from('pages')
    .select('id')
    .eq('document_id', documentId)
    .eq('page_number', pageNumber)
    .single();
  if (error) throw new Error(error.message);
  return data!.id as string;
}

function l2norm(v: number[]) {
  const s = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0)) || 1;
  return v.map((x) => x / s);
}

export async function insertPageEmbedding(args: {
  pageId: string;
  kind: 'image' | 'text';
  embedding: number[];
  imageIndex?: number | null;
}) {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const vec = l2norm(to1D(args.embedding));
  const { error } = await supabaseClient.from('page_embeddings').insert({
    page_id: args.pageId,
    kind: args.kind,
    image_index: args.imageIndex ?? null,
    embedding: vec,
  });
  if (error) throw new Error(error.message);
}

export async function rpcMatchPageEmbeddings(
  queryVec: number[] | number[][] | Float32Array,
  kind: MatchKind,
  limit = 20
) {
  const vec = to1D(queryVec);

  const { data, error } = await supabaseAdmin.rpc('match_page_embeddings', {
    // IMPORTANT: match the SQL function's param names exactly  
    match_kind: kind,          // can be null
    match_limit: limit,
    q: vec,    
  });

  if (error) throw new Error(error.message);

  return (data ?? []) as Array<{
    document_id: string;
    document_name: string;
    url: string;
    page_number: number;
    kind: 'image' | 'text';
    similarity: number;
    distance: number;
  }>;
}

// BONUS CHALLENGE: Implement a method to export highlights to a JSON file
// async exportToJson(pdfId: string, filePath: string): Promise<void> {
//   // Retrieve highlights and write to a JSON file
// }
export const exportToJson = async (pdfId: string, filePath: string) => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabaseClient
    .from("highlights")
    .select()
    .eq("pdfId", pdfId);
  if (data && data.length > 0) {
    fs.writeFile(filePath, JSON.stringify(data), (error) => {
      if (error) {
        throw error;
      }
    });
  }
  if (error) {
    throw error;
  }
  return null;
};

// BONUS CHALLENGE: Implement a method to import highlights from a JSON file
// async importFromJson(filePath: string): Promise<void> {
//   // Read from JSON file and insert highlights into the database
// }
export const importFromJson = async (pdfId: string, filePath: string) => {
  fs.readFile(filePath, "utf-8", (error, data) => {
    if (error) {
      throw error;
    }
    const highlights = JSON.parse(data);
    saveBulkHighlights(highlights);
  });
  return null;
};
