// app/api/semantic/query/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function getDbPath() {
  const dir = path.join(process.cwd(), "data");
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  return path.join(dir, "highlights.db");
}

function openDb() {
  const db = new sqlite3.Database(
    getDbPath(),
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  );
  return db;
}

type Row = {
  pdfId: string;
  page: number;
  chunk: number;
  content: string;
  embedding: string;
};

const cosine = (a: number[], b: number[]) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
};

export async function POST(req: NextRequest) {
  let db: sqlite3.Database | null = null;
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
    }

    const body = await req.json();
    const { query, pdfIds, topK = 20 } = body as {
      query: string;
      pdfIds?: string[];
      topK?: number;
    };
    if (!query) return Response.json({ error: "Missing query" }, { status: 400 });

    const qEmb = (
      await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      })
    ).data[0].embedding;

    db = openDb();

    const rows: Row[] = await new Promise((resolve, reject) => {
      const sql = pdfIds?.length
        ? `SELECT pdfId, page, chunk, content, embedding
             FROM page_embeddings
            WHERE pdfId IN (${pdfIds.map(() => "?").join(",")})`
        : `SELECT pdfId, page, chunk, content, embedding
             FROM page_embeddings`;
      db!.all(sql, pdfIds ?? [], (err, r) => (err ? reject(err) : resolve(r)));
    });

    if (!rows.length) {
      return Response.json([], { status: 200 });
    }

    const scored = rows
      .map((r) => {
        const emb = JSON.parse(r.embedding) as number[];
        return { ...r, score: cosine(qEmb, emb) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return Response.json(
      scored.map(({ pdfId, page, content, score }) => ({
        pdfId,
        page,
        text: content,
        score,
      })),
      { status: 200 }
    );
  } catch (e: any) {
    console.error("POST /api/semantic/query failed:", e);
    const msg = typeof e?.message === "string" ? e.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  } finally {
    try { db?.close(); } catch {}
  }
}
