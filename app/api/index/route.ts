// app/api/index/route.ts
import { storageMethod } from "../../utils/env";
import HighlightStorage from "../../utils/highlightStorage";
import { StorageMethod } from "../../utils/types";

export async function POST(req: Request) {
  let response;
  let db;
  try {
    const body = await req.json();
    if (storageMethod === StorageMethod.sqlite) {
      db = new HighlightStorage(body.pdfId);
      await db.indexWords(body.pdfId, body.words);
    } else {
      throw new Error("Index via supabase has not been implemented");
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
