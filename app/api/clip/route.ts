// app/api/clip/route.ts
import { NextResponse } from "next/server";

function normalizeEmbedding(raw: any): number[] {
  // Accept common shapes: {embedding:[...]}, {embedding:[[...]]}, [ [...]], Float32Array, etc.
  let arr: any =
    Array.isArray(raw) ? raw
    : Array.isArray(raw?.embedding) ? raw.embedding
    : raw?.embedding ?? raw?.data ?? raw?.vector ?? raw;

  // If batched (e.g. [[...512...]]) take first row
  if (Array.isArray(arr) && Array.isArray(arr[0])) arr = arr[0];

  // Typed arrays -> plain array
  if (arr && typeof arr.length === "number" && !Array.isArray(arr)) {
    arr = Array.from(arr as any);
  }

  if (!Array.isArray(arr)) {
    throw new Error("Upstream did not return an array embedding");
  }

  const flat = arr.map((x) => Number(x));
  if (flat.some((x) => !Number.isFinite(x))) {
    throw new Error("Embedding contains non-finite values");
  }
  return flat;
}

export async function POST(req: Request) {
  try {
    const { type, input } = await req.json();
    if (!type || !input) {
      return NextResponse.json({ error: "type and input required" }, { status: 400 });
    }

    const base = (process.env.FLASK_EMBEDDINGS_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

    let route: string | null = null;
    let body: any = {};
    if (type === "text") {
      route = "embed-text";
      body = { text: input };
    } else if (type === "image") {
      route = "embed-image";
      // If client sent a data URL, pass base64 to Flask; otherwise assume it's a reachable URL.
      const isDataUrl = typeof input === "string" && input.startsWith("data:image/");
      if (isDataUrl) {
        const base64 = input.split(",", 2)[1] ?? "";
        body = { image_base64: base64 };
      } else {
        body = { image_url: input };
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const resp = await fetch(`${base}/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => "");
      return NextResponse.json({ error: `Upstream ${route} failed: ${resp.status} ${msg}` }, { status: 502 });
    }

    const data = await resp.json();
    // Always return a 1-D vector
    const embedding = normalizeEmbedding(data);
    return NextResponse.json({ embedding }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
