// app/api/semantic/index/route.ts
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

function migrate(db: sqlite3.Database) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS page_embeddings(
         pdfId TEXT NOT NULL,
         page INTEGER NOT NULL,
         chunk INTEGER NOT NULL,
         content TEXT NOT NULL,
         embedding TEXT NOT NULL,
         PRIMARY KEY (pdfId, page, chunk)
       )`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

async function embedInBatches(inputTexts: string[], batchSize = 64) {
  const all: number[][] = [];
  for (let i = 0; i < inputTexts.length; i += batchSize) {
    const batch = inputTexts.slice(i, i + batchSize);
    const resp = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    for (const row of resp.data) all.push(row.embedding);
  }
  return all;
}

export async function POST(req: NextRequest) {
  let db: sqlite3.Database | null = null;
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not set in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { pdfId, pages } = body as {
      pdfId: string;
      pages: Array<{ page: number; text: string }>;
    };
    if (!pdfId || !Array.isArray(pages)) {
      return Response.json(
        { error: "Expected body: { pdfId, pages: [{page, text}, ...] }" },
        { status: 400 }
      );
    }

    db = openDb();
    await migrate(db);

    // remove any previous embeddings for this pdf
    await new Promise<void>((resolve, reject) => {
      db!.run("DELETE FROM page_embeddings WHERE pdfId = ?", [pdfId], (err) =>
        err ? reject(err) : resolve()
      );
    });

    // simple chunker: ~1200 chars per chunk; skip empty pages
    const makeChunks = (s: string, page: number) => {
      const text = (s || "").trim();
      if (!text) return [] as { page: number; chunk: number; text: string }[];
      const size = 1200;
      const out: { page: number; chunk: number; text: string }[] = [];
      let c = 0;
      for (let i = 0; i < text.length; i += size) {
        out.push({ page, chunk: c++, text: text.slice(i, i + size) });
      }
      return out.length ? out : [{ page, chunk: 0, text }];
    };

    const allChunks = pages.flatMap(({ page, text }) => makeChunks(text, page));
    if (allChunks.length === 0) {
      return Response.json({ ok: true, message: "No text to index" }, { status: 200 });
    }

    const inputs = allChunks.map((c) => c.text);
    const allEmbeddings = await embedInBatches(inputs, 64);

    // write in a transaction
    await new Promise<void>((resolve, reject) => {
      db!.serialize(() => {
        db!.run("BEGIN TRANSACTION");
        const stmt = db!.prepare(
          `INSERT INTO page_embeddings (pdfId, page, chunk, content, embedding)
           VALUES (?,?,?,?,?)`
        );
        try {
          for (let i = 0; i < allChunks.length; i++) {
            const { page, chunk, text } = allChunks[i];
            const emb = allEmbeddings[i];
            stmt.run(pdfId, page, chunk, text, JSON.stringify(emb));
          }
          stmt.finalize((err) => {
            if (err) {
              db!.run("ROLLBACK");
              reject(err);
              return;
            }
            db!.run("COMMIT", (cerr) => (cerr ? reject(cerr) : resolve()));
          });
        } catch (e) {
          db!.run("ROLLBACK");
          reject(e);
        }
      });
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/semantic/index failed:", e);
    const msg =
      typeof e?.message === "string" ? e.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  } finally {
    try { db?.close(); } catch {}
  }
}
