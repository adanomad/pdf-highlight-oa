// app/api/index/route.ts
import SQLiteDatabase from "../../utils/sqliteUtils";
import { StoredPdf } from "../../utils/types";

export async function POST(req: Request) {
  let response;
  let db;
  try {
    const body = await req.json();
    const pdfObj = body.pdfObj as StoredPdf;
    db = new SQLiteDatabase();
    await db.savePdf(pdfObj);
    response = new Response(null, { status: 200 });
  } catch (error) {
    console.log(error);
    response = new Response(null, { status: 500 });
  } finally {
    if (db) {
      await db.close();
    }
    return response;
  }
}
