// app/api/index/route.ts
import SQLiteDatabase from "../../../utils/sqliteUtils";

export async function POST(req: Request) {
  let response;
  let db;
  try {
    db = new SQLiteDatabase();
    const body: any = await req.json();
    for (let k = 0; k < body.length; ++k) {
      const obj: any = body[k];
      try {
        const vec_id = await db.saveEmbeddings(obj.pdfId, obj.embedding, obj.pageNumber, obj.lineNumber);
        if (obj.StoredHighlight) await db.saveHighlight(vec_id, obj.StoredHighlight);
      } catch(err) {
        console.log(err);
        response = new Response(null, { status: 500 });
      }
    }
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
