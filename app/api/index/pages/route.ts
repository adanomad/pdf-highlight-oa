// app/api/index/pages/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  upsertDocument,
  ensurePages,
  getPageId,
  insertPageEmbedding,
} from "../../../../app/utils/supabase";
import { computeTextEmbedding, computeImageEmbedding } from "../../../../app/utils/openclip";

function l2norm(v: number[]) {
  const s = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0)) || 1;
  return v.map((x) => x / s);
}


type Incoming = {
  name: string;
  url: string;
  pages: Array<{
    pageNumber: number;
    text?: string;
    images?: string[]; // data URLs ok
  }>;
};

export async function POST(req: NextRequest) {
  const baseUrl = req.nextUrl.origin; // <-- IMPORTANT
  let insertedText = 0;
  let insertedImages = 0;

  try {
    const body = (await req.json()) as Incoming;

    if (!body?.name || !body?.url || !Array.isArray(body.pages)) {
      return NextResponse.json({ error: "name, url, pages required" }, { status: 400 });
    }

    // 1) Upsert document
    const documentId = await upsertDocument(body.name, body.url);

    // 2) Ensure pages exist
    const maxPage = body.pages.reduce((m, p) => Math.max(m, p.pageNumber), 0);
    await ensurePages(documentId, maxPage);

    // 3) For each page: text emb + image embs
    for (const page of body.pages) {
      const pageId = await getPageId(documentId, page.pageNumber);

      // (a) text
      if (page.text && page.text.trim()) {
        const text = page.text.length > 4000 ? page.text.slice(0, 4000) : page.text;
        const tvec = await computeTextEmbedding(text, { baseUrl });
        // unwrap [[...]] if present and L2-normalize
        const tArr = Array.isArray((tvec as any)?.[0]) ? (tvec as any)[0] : (tvec as any);
        const tUnit = l2norm(tArr as number[]);
        await insertPageEmbedding({
        pageId,
        kind: "text",
        embedding: tUnit,
        });
        insertedText++;
      }

      // (b) images
      if (Array.isArray(page.images)) {
        for (let i = 0; i < page.images.length; i++) {
          const img = page.images[i];
          try {
            const ivec = await computeImageEmbedding(img, { baseUrl });
            // unwrap [[...]] if present and L2-normalize
            const iArr = Array.isArray((ivec as any)?.[0]) ? (ivec as any)[0] : (ivec as any);
            const iUnit = l2norm(iArr as number[]);
            await insertPageEmbedding({
            pageId,
            kind: "image",
            embedding: iUnit,
            imageIndex: i,
            });
            insertedImages++;

          } catch (e) {
            console.warn(`image embedding failed p${page.pageNumber}#${i}:`, e);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, insertedText, insertedImages }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/index/pages] failed:", e);
    return NextResponse.json({ error: e?.message ?? "indexing failed" }, { status: 500 });
  }
}
