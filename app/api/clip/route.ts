// app/api/clip/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { type, input } = await req.json();
    if (!type || !input) return NextResponse.json({ error: "type and input required" }, { status: 400 });

    const base = process.env.FLASK_EMBEDDINGS_URL || "http://127.0.0.1:5000";
    const route = type === "text" ? "embed-text" : type === "image" ? "embed-image" : null;
    if (!route) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const resp = await fetch(`${base.replace(/\/$/, "")}/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type === "text" ? { text: input } : { image_url: input }),
    });

    if (!resp.ok) return NextResponse.json({ error: `Upstream ${route} failed` }, { status: 502 });
    const data = await resp.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
