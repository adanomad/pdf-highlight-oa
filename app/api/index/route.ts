// app/api/index/route.ts
import { storageMethod } from "../../utils/env";
import HighlightStorage from "../../utils/highlightStorage";
import { StorageMethod } from "../../utils/types";

import {
  upsertDocument,
  ensurePages,
  getPageId,
  insertPageEmbedding,
} from "../../utils/supabase";

export async function POST(req: Request) {
  let db: HighlightStorage | undefined;
  try {
    const body = await req.json();

    // --- Branch 1: legacy sqlite word index ---
    if (body?.pdfId && Array.isArray(body?.words) && storageMethod === StorageMethod.sqlite) {
      db = new HighlightStorage(body.pdfId);
      await db.indexWords(body.pdfId, body.words);
      return new Response(null, { status: 200 });
    }

    // --- Branch 2: Supabase page-level embeddings ---
    if (body?.name && body?.url && typeof body?.numPages === 'number' && Array.isArray(body?.items)) {
      const { name, url, numPages, items } = body as {
        name: string;
        url: string;
        numPages: number;
        items: Array<{ pageNumber: number; kind: 'text' | 'image'; embedding: number[]; imageIndex?: number }>;
      };

      const documentId = await upsertDocument(name, url);
      await ensurePages(documentId, numPages);

      for (const it of items) {
        const pageId = await getPageId(documentId, it.pageNumber);
        await insertPageEmbedding({
          pageId,
          kind: it.kind,
          embedding: it.embedding,
          imageIndex: it.imageIndex ?? null,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Bad payload" }), { status: 400 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Index failed" }), { status: 500 });
  } finally {
    if (db) await db.close();
  }
}
