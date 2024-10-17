// app/api/docs/route.ts

import { getDocumentsFromSupabase } from "../../utils/supabase";

export async function GET(): Promise<Response> {
    const documents = await getDocumentsFromSupabase();

    return new Response(JSON.stringify(documents), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
    

} 