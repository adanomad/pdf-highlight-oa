// app/api/highlight/update/route.ts

import HighlightStorage from "../../../utils/highlightStorage";
import { storageMethod } from "../../../utils/env";
import {
  deleteHighlight as supabaseDeleteHighlight,
  saveBulkHighlights as supabaseSaveBulkHighlights,
  saveHighlight as supabaseSaveHighlight,
} from "../../../utils/supabase";
import { StorageMethod, StoredHighlight } from "../../../utils/types";

async function handleRequest(
  req: Request,
  action: (body: any, db?: HighlightStorage) => Promise<void>
): Promise<Response> {
  let db: HighlightStorage | undefined;
  try {
    const body = await req.json();
    if (storageMethod === StorageMethod.sqlite) {
      db = new HighlightStorage();
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

async function saveHighlights(body: any, db?: HighlightStorage): Promise<void> {
  if (db) {
    if (Array.isArray(body.highlights)) {
      await db.saveBulkHighlights(ensureKeywords(body.highlights));
    } else {
      await db.saveHighlight(ensureKeyword(body.highlights));
    }
  } else {
    if (Array.isArray(body)) {
      await supabaseSaveBulkHighlights(ensureKeywords(body));
    } else {
      await supabaseSaveHighlight(ensureKeyword(body));
    }
  }
}

async function removeHighlight(
  body: any,
  db?: HighlightStorage
): Promise<void> {
  if (db) {
    await db.deleteHighlight(body.pdfId, body.id);
  } else {
    await supabaseDeleteHighlight(body);
  }
}

function ensureKeyword(highlight: StoredHighlight): StoredHighlight {
  return {
    ...highlight,
    keyword: highlight.keyword || "",
  };
}

function ensureKeywords(highlights: StoredHighlight[]): StoredHighlight[] {
  return highlights.map(ensureKeyword);
}

export async function POST(req: Request): Promise<Response> {
  return handleRequest(req, saveHighlights);
}

export async function DELETE(req: Request): Promise<Response> {
  return handleRequest(req, removeHighlight);
}
