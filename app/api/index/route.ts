// app/api/index/route.ts
import { storageMethod } from "../../utils/env";
import HighlightStorage from "../../utils/highlightStorage";
import { StorageMethod } from "../../utils/types";
import { getDocument } from "pdfjs-dist";
import SQLiteDatabase from "@/utils/sqliteUtils";
import { getEmbedding } from "../../utils/server/embedding";

export async function POST(req: Request) {
  let response;
  let db;
  try {
    const body = await req.json();

    if (body.mode === "manual") {
      if (storageMethod === StorageMethod.sqlite) {
        db = new HighlightStorage(body.pdfId);
        await db.indexWords(body.pdfId, body.words);
      } else {
        throw new Error("Index via supabase has not been implemented");
      }
    }

    else if (body.mode === "auto") {
      db = new SQLiteDatabase();
      const rawDb = (db as any).db;

      const pdfRow = await new Promise<any>((resolve, reject) => {
        rawDb.get(
          `SELECT content FROM pdf_documents WHERE id = ?`,
          [body.pdfId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!pdfRow || !pdfRow.content) {
        return new Response(JSON.stringify({ error: "PDF not found" }), { status: 404 });
      }

      const pdfData = new Uint8Array(pdfRow.content);
      const pdf = await getDocument({ data: pdfData }).promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ").trim();

        if (!text) continue;

        const embedding = await getEmbedding(text);
        await db.savePageEmbedding(body.pdfId, pageNum, text, embedding);
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
