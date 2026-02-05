# API Reference

All API routes are Next.js App Router route handlers located under `app/api/`.

## `POST /api/highlight/get`

Retrieve all highlights for a given PDF.

**Source:** `app/api/highlight/get/route.ts`

### Request

```json
{
  "pdfId": "my_document__pdf"
}
```

The body is the `pdfId` string (sent directly as JSON, or as an object with a `pdfId` field depending on the storage method). The route handler reads `body.pdfId` for SQLite or passes the body directly to Supabase.

### Response

**200 OK**

```json
[
  {
    "id": "abc123",
    "pdfId": "my_document__pdf",
    "pageNumber": 1,
    "x1": 72.5,
    "y1": 100.2,
    "x2": 200.3,
    "y2": 115.8,
    "width": 612,
    "height": 792,
    "text": "Found \"keyword\"",
    "image": null,
    "keyword": "keyword"
  }
]
```

**500 Internal Server Error**

```json
{
  "error": "Internal Server Error",
  "details": "error message"
}
```

### Behavior

- SQLite: Instantiates `HighlightStorage`, calls `getHighlightsForPdf(body.pdfId)`, then closes the database connection in a `finally` block.
- Supabase: Calls `supabaseGetHighlightsForPdf(body.pdfId)`.

---

## `POST /api/highlight/update`

Save one or more highlights.

**Source:** `app/api/highlight/update/route.ts`

### Request (SQLite — single highlight)

```json
{
  "highlights": {
    "id": "abc123",
    "pdfId": "my_document__pdf",
    "pageNumber": 1,
    "x1": 72.5,
    "y1": 100.2,
    "x2": 200.3,
    "y2": 115.8,
    "width": 612,
    "height": 792,
    "text": "Found \"keyword\"",
    "keyword": "keyword"
  }
}
```

### Request (SQLite — bulk highlights)

```json
{
  "pdfId": "my_document__pdf",
  "highlights": [
    {
      "id": "abc123",
      "pdfId": "my_document__pdf",
      "pageNumber": 1,
      "x1": 72.5,
      "y1": 100.2,
      "x2": 200.3,
      "y2": 115.8,
      "width": 612,
      "height": 792,
      "text": "Found \"keyword\"",
      "keyword": "keyword"
    }
  ]
}
```

### Request (Supabase — single or bulk)

The body is the highlight object or array directly (no wrapping `highlights` key):

```json
[
  {
    "id": "abc123",
    "pdfId": "my_document__pdf",
    "pageNumber": 1,
    "x1": 72.5,
    "y1": 100.2,
    "x2": 200.3,
    "y2": 115.8,
    "width": 612,
    "height": 792,
    "text": "Found \"keyword\"",
    "keyword": "keyword"
  }
]
```

### Response

- **200 OK** — Empty body
- **500 Internal Server Error** — Empty body

### Behavior

- Detects single vs. bulk by checking `Array.isArray(body.highlights)` (SQLite) or `Array.isArray(body)` (Supabase).
- Ensures every highlight has a `keyword` field (defaults to `""` if missing).
- SQLite: Uses `INSERT OR REPLACE` (upsert) with transactions for bulk operations.
- Supabase: Uses `upsert()` for bulk and `insert()` for single.

---

## `DELETE /api/highlight/update`

Delete a single highlight.

**Source:** `app/api/highlight/update/route.ts`

### Request (SQLite)

```json
{
  "pdfId": "my_document__pdf",
  "id": "abc123"
}
```

### Request (Supabase)

The body is the highlight ID string directly:

```json
"abc123"
```

### Response

- **200 OK** — Empty body
- **500 Internal Server Error** — Empty body

### Behavior

- SQLite: Deletes by composite key `(pdfId, id)`.
- Supabase: Deletes by `id` only.

---

## `POST /api/index`

Index OCR-extracted words for a PDF. Currently only supports SQLite.

**Source:** `app/api/index/route.ts`

### Request

```json
{
  "pdfId": "my_document__pdf",
  "words": [
    {
      "keyword": "hello",
      "x1": 50,
      "y1": 100,
      "x2": 120,
      "y2": 115
    }
  ]
}
```

### Response

- **200 OK** — Empty body
- **500 Internal Server Error** — Empty body

### Behavior

- SQLite: Instantiates `HighlightStorage` and calls `indexWords(pdfId, words)`, which converts words to `StoredHighlight` objects with generated IDs and saves them in bulk.
- Supabase: Throws `"Index via supabase has not been implemented"`.

> **Note:** This route is currently not called in the application (the code in `App.tsx` that would call it is commented out).
