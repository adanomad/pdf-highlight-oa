// app/api/groq/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// GET handler (optional, for debugging)
export async function GET(request: Request) {
  return NextResponse.json({ message: "This endpoint only accepts POST requests." });
}

// POST handler that forwards the incoming message to Groq's API.
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build the payload for Groq.
    const payload = {
      model: "llama3-70b-8192",
      messages,
      temperature: 0.7,
    };

    // Call the external Groq API using axios.
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const responseMessage =
      response.data.choices?.[0]?.message?.content || "No response found";

    return NextResponse.json({ response: responseMessage });
  } catch (error: any) {
    console.error("Error processing request:", error.response?.data || error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
