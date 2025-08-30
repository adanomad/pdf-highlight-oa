// app/api/highlight/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { storageMethod } from "../../../utils/env";
import {
  dbReplaceHighlightsForPdfId,
  dbUpsertHighlights,
} from "../../../utils/supabase";
import { StoredHighlight } from "../../../utils/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts:
 *  A) { pdfId, highlights: StoredHighlight[] }  -> replace all for pdfId
 *  B) StoredHighlight[]                         -> upsert by id
 */
export async function POST(req: NextRequest) {
  try {
    if (storageMethod !== "supabase") {
      // Plug your sqlite path here if needed. For now, no-op.
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();

    // A) replace-all for a pdfId
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const { pdfId, highlights } = body as {
        pdfId: string;
        highlights: StoredHighlight[];
      };
      if (!pdfId || !Array.isArray(highlights)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
      await dbReplaceHighlightsForPdfId(pdfId, highlights);
      return NextResponse.json({ ok: true });
    }

    // B) upsert array
    if (Array.isArray(body)) {
      await dbUpsertHighlights(body as StoredHighlight[]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}
