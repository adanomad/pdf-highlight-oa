import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../../../utils/env";
import { getEmbedding } from "../../../utils/openai";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileBlob = formData.get("file");
    const title = formData.get("title") as string;
    if (!fileBlob || !title) {
      console.error("Missing file or title", { fileBlob, title });
      return new Response(JSON.stringify({ error: "Missing file or title" }), { status: 400 });
    }

    // Try to get a name for the file, fallback if not present
    const fileName = (fileBlob as any).name || `upload-${Date.now()}.pdf`;

    let arrayBuffer, buffer;
    try {
      arrayBuffer = await fileBlob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err) {
      console.error("Error converting fileBlob to buffer", err);
      return new Response(JSON.stringify({ error: "Failed to process file upload" }), { status: 500 });
    }

    // Upload PDF to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey);
    const storagePath = `pdfs/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage.from("pdfs").upload(storagePath, buffer, { upsert: true });
    if (uploadError) {
      console.error("Supabase upload error", uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
    }

    // Extract per-page text using pdfjs
    let pdf;
    try {
      pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    } catch (err) {
      console.error("PDF.js failed to parse document", err);
      return new Response(JSON.stringify({ error: "Failed to parse PDF document" }), { status: 500 });
    }
    const numPages = pdf.numPages;
    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(" ");
      let embedding = null;
      if (text.trim().length > 0) {
        try {
          embedding = await getEmbedding(text);
        } catch (err) {
          console.error(`OpenAI embedding failed for page ${i}`, err);
        }
      }
      pages.push({ page_number: i, text, embedding });
    }

    // Insert document record into Supabase
    const { error: insertError } = await supabase.from("documents").insert({
      title,
      storage_path: storagePath,
      pages,
    });
    if (insertError) {
      console.error("Supabase insert error", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    console.error("/api/documents/upload uncaught error", e);
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500 });
  }
} 