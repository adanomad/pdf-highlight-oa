// app/api/search/route.ts
import { NextRequest } from "next/server";
import { rpcMatchPageEmbeddings } from "../../../app/utils/supabase";
import { computeTextEmbedding } from "../../../app/utils/openclip";

function l2norm(v: number[]) {
  const s = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0)) || 1;
  return v.map((x) => x / s);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const kindParam = searchParams.get("kind");
    const limit = Number(searchParams.get("limit") || "20");
    if (!q) return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });

    const kind = kindParam === "text" ? "text" : kindParam === "image" ? "image" : null;

    let emb = await computeTextEmbedding(q);
    const arr = Array.isArray((emb as any)?.[0]) ? (emb as any)[0] : (emb as any);
    const qUnit = l2norm(arr as number[]);

    const rows = await rpcMatchPageEmbeddings(qUnit, kind, limit);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
