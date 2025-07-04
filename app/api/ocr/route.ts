// app/api/ocr/route.ts

import { googleApiKey } from "../../utils/env";

// API for server to call the Google Vision API
async function handleRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json();

    const googleResponse = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + googleApiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: body.requests })
    });
    const googleResponseValue = await googleResponse.json();

    return new Response(JSON.stringify(googleResponseValue), {
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
  }
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req);
}