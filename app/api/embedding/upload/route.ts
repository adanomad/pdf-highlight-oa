// app/api/embedding/upload/route.ts
import EmbeddingStorage from "../../../utils/embeddingStorage";
import { storageMethod } from "../../../utils/env";
import { StorageMethod, StoredEmbedding } from "../../../utils/types";

async function handleRequest(
  req: Request,
  action: (body: any, db?: EmbeddingStorage) => Promise<void>
): Promise<Response> {
  let db: EmbeddingStorage | undefined;
  try {
    const body = await req.json();
    if (storageMethod === StorageMethod.sqlite) {
      db = new EmbeddingStorage();
    }
    await action(body, db);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 500 });
  } finally {
    if (db) {
      await db.close();
    }
  }
}

async function saveEmbedding(body: any, db?: EmbeddingStorage): Promise<void> {
  if (db) {
    if (Array.isArray(body.embeddings)) {
      await db.saveBulkEmbedding(body.embeddings);
    } else {
      await db.saveEmbedding(body.embeddings);
    }
  } else {
    console.log("Databse not initialized");
  }
}

async function removeEmbedding(
  body: any,
  db?: EmbeddingStorage
): Promise<void> {
  if (db) {
    await db.deleteEmbedding(body.pdfId, body.id);
  } else {
    console.log("Databse not initialized");
  }
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req, saveEmbedding);
}

export async function DELETE(req: Request): Promise<Response> {
  return handleRequest(req, removeEmbedding);
}
