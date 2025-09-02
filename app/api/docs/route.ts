// app/api/docs/route.ts
import { getDocumentsFromSupabase } from "../../utils/supabase";

export async function GET(): Promise<Response> {
  try {
    const documents = await getDocumentsFromSupabase();
    return new Response(JSON.stringify(documents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/docs failed:", err);
    return new Response(JSON.stringify({ error: "Failed to list documents" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
