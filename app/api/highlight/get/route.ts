// app/api/highlight/get/route.ts
import HighlightStorage from "../../../utils/highlightStorage";
import { storageMethod } from "../../../utils/env";
import { StorageMethod } from "../../../utils/types";
import { getHighlightsForPdf as supabaseGetHighlightsForPdf } from "../../../utils/supabase";

async function handleRequest(req: Request): Promise<Response> {
  let db: HighlightStorage | undefined;
  try {
    const body = await req.json();
    let highlights;

    if (storageMethod === StorageMethod.sqlite) {
      db = new HighlightStorage();
      highlights = await db.getHighlightsForPdf(body.pdfId);
    } else {
      highlights = await supabaseGetHighlightsForPdf(body.pdfId);
    }

    return new Response(JSON.stringify(highlights), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleRequest:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error("Error closing database:", closeError);
      }
    }
  }
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req);
}
