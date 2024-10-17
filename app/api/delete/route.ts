// app/api/delete/route.ts

import { deleteDocumentFromSupabase } from "../../utils/supabase";

// API route for handling DELETE requests (sending file name in the body)
export async function DELETE(req: Request): Promise<Response> {
    const { fileName } = await req.json(); // Expecting { "fileName": "your_file.pdf" }
    await deleteDocumentFromSupabase(fileName);
    return new Response(null, { status: 204 }); 
}
