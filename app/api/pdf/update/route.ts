// app/api/highlight/update/route.ts

import PdfStorage from "../../../utils/pdfStorage";
import { storageMethod } from "../../../utils/env";
// import {
//   deleteHighlight as supabaseDeleteHighlight,
//   saveBulkHighlights as supabaseSaveBulkHighlights,
//   saveHighlight as supabaseSaveHighlight,
// } from "../../../utils/supabase";
import { StorageMethod } from "../../../utils/types";

async function handleRequestPdf(
  req: Request,
  action: (body: any, db?: PdfStorage) => Promise<void>
): Promise<Response> {
  let db: PdfStorage | undefined;
  try {
    const body = await req.json();
    if (storageMethod === StorageMethod.sqlite) {
      db = new PdfStorage();
    }
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

async function savePdf(body: any, db?: PdfStorage): Promise<void> {
  if (db) {
    await db.savePdf(body);
  } else {//to do: save to supabase
    //await supabaseSaveHighlight((body));
  }
}
async function removePdf(
  body: any,
  db?: PdfStorage
): Promise<void> {
  if (db) {
    await db.deletePdf(body.id);
  } else {//to do: delete from supabase
    //await supabaseDeleteHighlight(body);
  }
}
export async function POST(req: Request): Promise<Response> {
  return handleRequestPdf(req, savePdf);
}

export async function DELETE(req: Request): Promise<Response> {//unused, but can be used to delete a pdf file by its pdfId
  return handleRequestPdf(req, removePdf);
}