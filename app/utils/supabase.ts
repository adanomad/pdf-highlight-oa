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
