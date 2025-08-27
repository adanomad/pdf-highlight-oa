// app/api/files/delete/route.ts
import { NextResponse } from "next/server";
import { deleteDocumentFromSupabase } from "../../../utils/supabase";

export async function DELETE(req: Request) {
  const { fileName } = await req.json();
  if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });

  try {
    await deleteDocumentFromSupabase(fileName);
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Delete failed" }, { status: 500 });
  }
}
