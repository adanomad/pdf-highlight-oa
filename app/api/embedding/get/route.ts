// app/api/embedding/get/route.ts
import EmbeddingStorage from "../../../utils/embeddingStorage";
import { storageMethod } from "../../../utils/env";
import { StorageMethod } from "../../../utils/types";

async function handleRequest(req: Request): Promise<Response> {
  let db: EmbeddingStorage | undefined;
  try {
    const body = await req.json();
    let highlights;

    if (storageMethod === StorageMethod.sqlite) {
      db = new EmbeddingStorage();
      highlights = await db.searchEmbedding(body.pdfId, body.query);
    } else {
    console.log("Databse not initialized");
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
        details: error.message,
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
