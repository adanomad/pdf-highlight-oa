import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../../../utils/env";
import { getEmbedding } from "../../../utils/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
    }
    const embedding = await getEmbedding(query);
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Call the match_pages function
    const { data, error } = await supabase.rpc("match_pages", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 10,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ results: data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
} 