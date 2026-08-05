// app/api/highlight/update/route.ts
import SQLiteDatabase from "../../../../app/utils/sqliteUtils"
import { StoredPdf } from "../../../utils/types";

async function handleRequest(
  req: Request,
  action: (body: any, db?: SQLiteDatabase) => Promise<void>
): Promise<Response> {
  let db: SQLiteDatabase | undefined;
  try {
    const body = await req.json();
    db = new SQLiteDatabase();
    await action(body, db);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 500 });
  } finally {
    if (db) {
      await db.close();
    }
  }
}

async function savePdfs(body: any, db?: SQLiteDatabase): Promise<void> {
  if (db) {
    await db.savePdf(ensureName(body.pdfObj));
  }
}

async function deletePdf(
  body: any,
  db?: SQLiteDatabase
): Promise<void> {
  if (db) {
    await db.deletePdf(body.id);
  } else {
    //await supabaseDeleteHighlight(body);
  }
}

function ensureName(pdf: StoredPdf): StoredPdf {
  return {
    ...pdf,
    name: pdf.name || "",
  };
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req, savePdfs);
}

export async function DELETE(req: Request): Promise<Response> {
  return handleRequest(req, deletePdf);
}
