// app/api/files/upload/route.ts
import { NextResponse } from "next/server";
import { uploadToSupabase } from "../../../utils/supabase";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const publicUrl = await uploadToSupabase(file);
    if (!publicUrl) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

    return NextResponse.json({ fileUrl: publicUrl }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
