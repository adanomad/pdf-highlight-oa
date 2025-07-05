import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../../utils/env";

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const pdfId = searchParams.get('pdfId');

    if (!pdfId) {
      return new Response(
        JSON.stringify({ error: "PDF ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get PDF metadata from database
    const { data: pdfData, error: dbError } = await supabase
      .from('pdf')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (dbError || !pdfData) {
      return new Response(
        JSON.stringify({ error: "PDF not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return PDF data with URL
    return new Response(
      JSON.stringify({
        id: pdfData.id,
        filename: pdfData.filename,
        fileUrl: pdfData.file_url,
        pages: pdfData.pages,
        uploadedAt: pdfData.uploaded_at
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Get PDF error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 