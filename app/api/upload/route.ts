// app/api/upload/route.ts
import { uploadToSupabase } from "../../utils/supabase";

export async function POST(req: Request): Promise<Response> {
    let response;
      // Parse the request body to get the File
      const formData = await req.formData();
      const file = formData.get("file") as File;

      const publicUrl = await uploadToSupabase(file);

      response = new Response(JSON.stringify({ fileUrl: publicUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    
    return response;
  }

  