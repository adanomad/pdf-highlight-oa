// app/api/upload/route.ts
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../../utils/env";
import { getAllPageEmbeddings } from '../../utils/embeddingUtils';

// TODO: refactor to structure like other endpoints (with a `handleRequest` function), and factor supabase util functions
export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file || file.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: "Invalid file type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `pdfs/${timestamp}-${filename}`;

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    // Insert into database
    const { data: dbData, error: dbError } = await supabase
      .from('pdf')
      .insert({
        filename: filename,
        file_path: filePath,
        file_url: urlData.publicUrl,
        pages: null,
        content_hash: null // TODO: dedup if time allows
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: "Database insert failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Trigger embedding generation if upload successful
    if (dbData) {
      // done async for seperate error handling and fast UX (only seeing pdf upload time)
      generateEmbeddingsInBackground(dbData.id, urlData.publicUrl);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdfId: dbData.id,
        filePath,
        url: urlData.publicUrl
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function generateEmbeddingsInBackground(pdfId: string, pdfUrl: string) {
  try {
    const embeddings = await getAllPageEmbeddings(pdfUrl, pdfId);

    // Store embeddings in database
    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const embedding of embeddings) {
      await supabase
        .from('embedding')
        .insert({
          doc_id: pdfId,
          page_no: embedding.pageNumber,
          chunk_no: 0,
          text: embedding.text,
          text_vec: embedding.embedding
        });
    }

    // Update the pdf record with page count
    await supabase
      .from('pdf')
      .update({ pages: embeddings.length })
      .eq('id', pdfId);

    console.log('Background embedding generation sucess!');

  } catch (error) {
    console.error('Background embedding generation failed:', error);
  }
}