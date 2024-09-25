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
