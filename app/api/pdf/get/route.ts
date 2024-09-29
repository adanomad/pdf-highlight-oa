// app/api/pdf/get/route.ts

import { storageMethod } from "../../../utils/env";
import pdfStorage from "../../../utils/pdfStorage";
import { StorageMethod } from "../../../utils/types";

// Modified from highlight api route
async function handleRequest(req: Request): Promise<Response> {
  let db: pdfStorage | undefined;
  try {
    const body = await req.json();
    let pdfs;

    if (storageMethod === StorageMethod.sqlite) {
      db = new pdfStorage();
      if (body?.amount > 1) {
        pdfs = await db.getBulkPdf(body.amount);
      }
      else {
        pdfs = await db.getPdf(body.id)
      }
    } else {
      //TODO supabase
    }

    return new Response(JSON.stringify(pdfs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleRequest:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error("Error closing database:", closeError);
      }
    }
  }
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req);
}