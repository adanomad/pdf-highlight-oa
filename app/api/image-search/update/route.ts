// api/image-search/update/route.ts

import { runImageSearch } from "../../../utils/imageSearchServer";

export async function POST(req: Request) {
  try {
    // Parse form data to extract the search term
    const formData = await req.formData();
    const searchTerm = formData.get('searchTerm') as string;

    // Run the mock image search
    const similarity = await runImageSearch(searchTerm);

    // Return the similarity score as a JSON response
    return new Response(
      JSON.stringify({ similarity }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Image search failed', details: error.message }), 
      { status: 500 }
    );
  }
}
