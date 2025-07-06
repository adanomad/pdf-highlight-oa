// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import SQLiteDatabase from "@/utils/sqliteUtils";
import { getEmbedding, cosineSimilarity } from "../_utils/embedding";;

export async function POST(req: NextRequest) {
  try {
    const { pdfId, query } = await req.json();

    if (!pdfId || !query) {
      return NextResponse.json({ error: "pdfId and query are required" }, { status: 400 });
    }

    const queryEmbedding = await getEmbedding(query);
    const db = new SQLiteDatabase();
    const rawDb = (db as any).db;

    const pages: {
      page_number: number;
      text: string;
      embedding_vector: string;
    }[] = await new Promise((resolve, reject) => {
      rawDb.all(
        `SELECT page_number, text, embedding_vector FROM pdf_pages WHERE pdf_id = ?`,
        [pdfId],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const rankedPages = pages
      .map((page) => {
        const similarity = cosineSimilarity(
          queryEmbedding,
          JSON.parse(page.embedding_vector)
        );
        return {
          pageNumber: page.page_number,
          text: page.text,
          similarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // top 5 matches

    return NextResponse.json({ results: rankedPages });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search PDF" }, { status: 500 });
  }
}
