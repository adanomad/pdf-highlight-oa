import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../../utils/env";
import { getEmbedding } from '../../utils/embeddingUtils';

export async function POST(req: Request): Promise<Response> {
  try {
    const { query, maxCount = 5 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: "Query text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const queryEmbedding = await getEmbedding(query);

    // sim. search with function
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: results, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.05,
      match_count: maxCount
    });

    if (error) {
      console.error('Search error:', error);
      return new Response(
        JSON.stringify({ error: "Search failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: results || [],
        query,
        maxCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}