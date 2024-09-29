// app/api/highlight/update/route.ts

import { storageMethod } from "../../../utils/env";
import pdfStorage from "../../../utils/pdfStorage";
import { StorageMethod, StoredPdf } from "../../../utils/types";

// Modified from highlight api route
async function handleRequest(
  req: Request,
  action: (body: any, db?: pdfStorage) => Promise<void>
): Promise<Response> {
  let db: pdfStorage | undefined;
  try {
    const body = await req.json();
    if (storageMethod === StorageMethod.sqlite) {
      db = new pdfStorage();
    }
    return new Response(null, { status: 200 }) //TODO add somekind of feedback
  } catch (error) {
    console.error(error);
    if (error == "supabase not implemented") {
        return new Response(null, { status: 501 });
    }
    return new Response(null, { status: 500 });
  } finally {
    if (db) {
    await db.close();
    }
  }
}

async function savePdf(body: any, db?: pdfStorage): Promise<void> {
  if (db) {
    db.savePdf(body);
  }
  else {
    throw new Error("supabase not implemented");
    //TODO supabase
  }
}

async function deletePdf(body: any, db?: pdfStorage): Promise<void> {
  if (db) {
    db.deletePdf(body.id);
  } else {
    throw new Error("supabase not implemented");
    //TODO supabase
  }
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req, savePdf);
}

export async function DELETE(req: Request): Promise<Response> {
  return handleRequest(req, deletePdf);
}
