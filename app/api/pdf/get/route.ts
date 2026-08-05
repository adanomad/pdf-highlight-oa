// app/api/highlight/get/route.ts
import SQLiteDatabase from "../../../utils/sqliteUtils";

async function handleRequest(req: Request): Promise<Response> {
  let db: SQLiteDatabase | undefined;
  try {
    const body = await req.json();
    let pdf;

    db = new SQLiteDatabase();
    pdf = await db.getPdf(body.pdfId);

    return new Response(JSON.stringify(pdf), {
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
