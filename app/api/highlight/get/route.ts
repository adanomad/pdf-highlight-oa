// app/api/highlight/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { storageMethod } from "../../../utils/env";
import { dbGetHighlightsByPdfId } from "../../../utils/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { pdfId } = await req.json();
    if (!pdfId) {
      return NextResponse.json({ error: "Missing pdfId" }, { status: 400 });
    }

    if (storageMethod !== "supabase") {
      // If you still support sqlite elsewhere, wire it here. For now, empty.
      return NextResponse.json([]);
    }

    const data = await dbGetHighlightsByPdfId(pdfId);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
