// app/api/files/list/route.ts
import { NextResponse } from "next/server";
import { getDocumentsFromSupabase } from "../../../utils/supabase";

export async function GET() {
  const docs = await getDocumentsFromSupabase();
  return NextResponse.json(docs, { status: 200 });
}
