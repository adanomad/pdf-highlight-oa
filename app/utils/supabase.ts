import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";
import { StoredHighlight } from "./types"; 
//import fs from "fs";

//Create and export Supabase client for general use
export const supabase = createClient(supabaseUrl, supabaseKey);


export const saveHighlight = async (highlight: StoredHighlight) => {
  const { error } = await supabase.from("highlights").insert(highlight);
  if (error) {
    throw error;
  }
  return null;
};

export const saveBulkHighlights = async (highlights: StoredHighlight[]) => {
  const { error } = await supabase.from("highlights").upsert(highlights);
  if (error) {
    throw error;
  }
  return null;
};


export const getHighlightsForPdf = async (pdfId: string) => {
  const { data, error } = await supabase
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

export const deleteHighlight = async (id: string) => {
  const { error } = await supabase
    .from("highlights")
    .delete()
    .eq("id", id);
  if (error) {
    throw error;
  }
  return null;
};

