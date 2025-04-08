// app/api/gemini/route.ts
import { NextResponse } from "next/server";
import { apiKey } from "../../utils/env";

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: query,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return NextResponse.json({
        text: data.candidates[0].content.parts[0].text,
      });
    } else {
      return NextResponse.json({ error: "Error generating content" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error connecting to Gemini API" }, { status: 500 });
  }
}
