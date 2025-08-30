// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceKey } from "@/app/utils/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const pdfId = (form.get("pdfId") as string) || "misc";
    const folder = (form.get("folder") as string) || "uploads";
    const filename = (form.get("filename") as string) || file?.name || "upload.pdf";

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const path = `${folder}/${pdfId}/${Date.now()}-${filename}`;

    const { error } = await supabase.storage
      .from("pdfs")
      .upload(path, Buffer.from(arrayBuffer), {
        contentType: file.type || "application/pdf",
        upsert: true,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = supabase.storage.from("pdfs").getPublicUrl(path);
    return NextResponse.json({ path, publicUrl: data?.publicUrl || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
