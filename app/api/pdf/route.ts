// app/api/highlight/get/route.ts
import PdfStorage from "../../utils/pdfStorage";
import { storageMethod } from "../../utils/env";
import { StorageMethod } from "../../utils/types";

export async function POST(req: Request): Promise<Response> {
    let response;
    let db;
    try {
      const body = await req.json();
      if (storageMethod === StorageMethod.sqlite) {
        db = new PdfStorage();
        await db.storePdf(body);
      } else {
        throw new Error("Uploading PDF via supabase has not been implemented");
      }
      response = new Response(null, { status: 201 });
    } catch (error) {
      console.log(error);
      response = new Response(null, { status: 500 });
    } finally {
      if (db) {
        await db.close();
      }
    }
    return response;
}
