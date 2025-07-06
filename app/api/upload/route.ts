import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import SQLiteDatabase from "@/utils/sqliteUtils";

const db = new SQLiteDatabase();

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file: File | null = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const id = randomUUID();

  try {
    await db.savePDF(buffer, id, file.name, buffer.length);

    return NextResponse.json({ id, filename: file.name });
  } catch (error) {
    console.error("Failed to save PDF:", error);
    return NextResponse.json({ error: "Failed to save PDF" }, { status: 500 });
  }
}