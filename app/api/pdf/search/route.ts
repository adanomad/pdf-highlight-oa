// app/api/pdf/get/route.ts
import { SearchResult } from "../../../utils/types";
import SQLiteDatabase from "../../../utils/sqliteUtils";

async function handleRequest(req: Request): Promise<Response> {
  let db: SQLiteDatabase | undefined;
  try {
    let results: SearchResult[] = [];

    const body = await req.json();
    db = new SQLiteDatabase();
    results = await db.search(body.queryToEmbed);
    console.log(results);
    if (results === null) {
      return new Response(
        JSON.stringify({ error: "No PDF uploaded yet!" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error : any) {
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
