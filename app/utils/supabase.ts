// app/utils/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";
import { StoredHighlight } from "./types";
import fs from "fs";

export const saveHighlight = async (highlight: StoredHighlight) => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabaseClient.from("highlights").insert(highlight);
  if (error) {
    throw error;
  }
  return null;
};

export const saveBulkHighlights = async (highlights: StoredHighlight[]) => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabaseClient.from("highlights").upsert(highlights);
  if (error) {
    throw error;
  }
  return null;
};

export const getHighlightsForPdf = async (pdfId: string) => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabaseClient
    .from("highlights")
    .select()
    .eq("pdfId", pdfId);
  if (data && data.length > 0) {
    return data;
  }
  if (error) {
    throw error;
  }
  return null;
};

export const updateHighlight = async (
  id: string,
  updatedData: Partial<StoredHighlight>
) => {
  return null;
};

export const deleteHighlight = async (id: string) => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabaseClient
    .from("highlights")
    .delete()
    .eq("id", id);
  if (error) {
    throw error;
  }
  return null;
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

// OA: Implementing method that uploads PDF to a supabase storage bucket
/**
 * Uploads a PDF file to Supabase Storage.
 * @param file - The PDF file to upload.
 * @returns The public URL of the uploaded file.
 */
export const uploadToSupabase = async (file: File): Promise<string | null> => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  const fileName = `pdf/${file.name}`;
  const { error } = await supabaseClient.storage
    .from('pdf_bucket')
    .upload(fileName, file, {
      cacheControl: '0',
      upsert: true 
    });
  if (error) {
    console.error("Error uploading PDF to Supabase: ", error.message)
    return null;
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from('pdf_bucket')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// OA: Challenge 2; Gets all docs from Supabase
export const getDocumentsFromSupabase = async () => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabaseClient.storage
    .from('pdf_bucket')
    .list('pdf', {
      limit: 100,
    });
  
  if (error) {
    console.error("Error fetching documents:", error.message);
    return [];
  }
  // Filter out '.emptyFolderPlaceholder file'
  const filteredData = data.filter((file) => file.name !== ".emptyFolderPlaceholder");
  
  return filteredData.map((file) => ({
    id: file.name,
    name: file.name,
    url: `${supabaseUrl}/storage/v1/object/public/pdf_bucket/pdf/${file.name}`,
  }));

}

// OA: added delete functionality
export const deleteDocumentFromSupabase = async (filename: string) => {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabaseClient.storage
    .from("pdf_bucket")
    .remove([`pdf/${filename}`]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};
