# Utilities

All utility modules are located in `app/utils/`.

## pdfUtils.ts

**File:** `app/utils/pdfUtils.ts`

PDF processing functions using `pdfjs-dist` for text extraction and coordinate calculation.

### `searchPdf(keywords, pdfUrl, viewportZoom?)`

Searches a PDF for keywords and returns highlights with bounding box coordinates.

```typescript
searchPdf(
  keywords: string[],
  pdfUrl: string,
  viewportZoom: number = 1
): Promise<IHighlight[]>
```

**Process:**
1. Loads the PDF document via `pdfjs.getDocument(pdfUrl)`.
2. Iterates through each page, extracting text content.
3. Groups text items into lines based on matching y-coordinates (`item.transform[5]`).
4. For each line, performs case-insensitive regex matching against each keyword.
5. Calculates bounding box coordinates from the matched text items' transform matrices and widths.
6. Flips y-coordinates to match the viewport coordinate system.
7. Returns an array of `IHighlight` objects with `content`, `position`, and `comment` fields.

### `convertPdfToImages(file)`

Converts each page of a PDF file to a base64-encoded PNG image (for OCR input).

```typescript
convertPdfToImages(file: File): Promise<string[]>
```

**Process:**
1. Reads the file as a data URL.
2. Loads the PDF with `pdfjs.getDocument()`.
3. For each page, renders to an off-screen `<canvas>` at scale 1.
4. Captures the canvas as a data URL (`canvas.toDataURL()`).
5. Returns an array of base64 image strings.

### `getPdfId(pdfName, email?)`

Generates a deterministic identifier for a PDF based on filename and optional user email.

```typescript
getPdfId(pdfName: string, email?: string): string
```

- Replaces `.` with `__` in the filename.
- If an email is provided, appends it with `@` replaced by `__at__` and `.` replaced by `__`.
- Example: `getPdfId("doc.pdf", "user@example.com")` returns `"doc__pdf__user__at__example__com"`.

---

## highlightStorage.ts

**File:** `app/utils/highlightStorage.ts`

Wrapper class around `SQLiteDatabase` providing the storage interface used by API routes.

### Class: `HighlightStorage`

```typescript
class HighlightStorage {
  constructor()
  saveHighlight(highlight: StoredHighlight): Promise<void>
  saveBulkHighlights(highlights: StoredHighlight[]): Promise<void>
  getHighlightsForPdf(pdfId: string): Promise<StoredHighlight[]>
  deleteHighlight(pdfId: string, id: string): Promise<void>
  indexWords(pdfId: string, words: Word[]): Promise<void>
  close(): Promise<void>
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `saveHighlight` | Saves a single highlight. Defaults `keyword` to `""` if missing. |
| `saveBulkHighlights` | Saves multiple highlights. Defaults `keyword` to `""` for each. |
| `getHighlightsForPdf` | Retrieves all highlights for a given `pdfId`. |
| `deleteHighlight` | Deletes a highlight by composite key `(pdfId, id)`. |
| `indexWords` | Converts OCR word data to `StoredHighlight` objects (with generated IDs, `pageNumber: -1`, zero dimensions) and bulk-saves them. |
| `close` | Closes the underlying SQLite database connection. |

---

## sqliteUtils.ts

**File:** `app/utils/sqliteUtils.ts`

Low-level SQLite database operations using the `sqlite3` package.

### Class: `SQLiteDatabase`

```typescript
class SQLiteDatabase {
  constructor()  // opens/creates highlights.db
  saveHighlight(highlight: StoredHighlight): Promise<void>
  saveBulkHighlights(highlights: StoredHighlight[]): Promise<void>
  getHighlightsForPdf(pdfId: string): Promise<StoredHighlight[]>
  deleteHighlight(pdfId: string, id: string): Promise<void>
  close(): Promise<void>
}
```

### Database Schema

Table: `highlights`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary key (composite) |
| `pdfId` | TEXT | Primary key (composite) |
| `pageNumber` | INTEGER | NOT NULL |
| `x1` | REAL | NOT NULL |
| `y1` | REAL | NOT NULL |
| `x2` | REAL | NOT NULL |
| `y2` | REAL | NOT NULL |
| `width` | REAL | |
| `height` | REAL | |
| `text` | TEXT | |
| `image` | TEXT | |
| `keyword` | TEXT | |

### Key Implementation Details

- Database file is located at `process.cwd()/highlights.db`.
- Table is created automatically via `migrate()` in the constructor (`CREATE TABLE IF NOT EXISTS`).
- All methods await `ensureMigrated()` before executing queries.
- `saveHighlight` and `saveBulkHighlights` use `INSERT OR REPLACE` (upsert behavior).
- `saveBulkHighlights` wraps operations in a transaction (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`).

---

## supabase.ts

**File:** `app/utils/supabase.ts`

Supabase client functions for cloud-based highlight storage.

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `saveHighlight` | `(highlight: StoredHighlight) => Promise<null>` | Inserts a single highlight |
| `saveBulkHighlights` | `(highlights: StoredHighlight[]) => Promise<null>` | Upserts multiple highlights |
| `getHighlightsForPdf` | `(pdfId: string) => Promise<StoredHighlight[] \| null>` | Retrieves highlights by pdfId |
| `updateHighlight` | `(id: string, updatedData: Partial<StoredHighlight>) => Promise<null>` | Stub (not implemented) |
| `deleteHighlight` | `(id: string) => Promise<null>` | Deletes a highlight by id |
| `exportToJson` | `(pdfId: string, filePath: string) => Promise<null>` | Exports highlights to a JSON file on disk |
| `importFromJson` | `(pdfId: string, filePath: string) => Promise<null>` | Imports highlights from a JSON file on disk |

Each function creates a new Supabase client using credentials from `env.ts`.

---

## types.ts

**File:** `app/utils/types.ts`

Shared type definitions.

### `StoredHighlight`

The database representation of a highlight:

```typescript
interface StoredHighlight {
  id: string;
  pdfId: string;
  pageNumber: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  text: string;       // comment text (e.g., 'Found "keyword"')
  image?: string;     // base64 screenshot for area highlights
  keyword: string;    // matched keyword or content text
}
```

### `StorageMethod`

```typescript
enum StorageMethod {
  supabase = "supabase",
  sqlite = "sqlite",
}
```

---

## utils.ts

**File:** `app/utils/utils.ts`

Converter functions between the `react-pdf-highlighter` library's `IHighlight` type and the database `StoredHighlight` type.

### `IHighlightToStoredHighlight(highlight, pdfId)`

Converts an `IHighlight` object to a `StoredHighlight` for database storage.

```typescript
IHighlightToStoredHighlight(highlight: IHighlight, pdfId: string): StoredHighlight
```

**Field mapping:**
- `position.boundingRect` coordinates map to `x1`, `y1`, `x2`, `y2`, `width`, `height`
- `comment.text` maps to `text`
- `content.text` maps to `keyword`
- `content.image` maps to `image`

### `StoredHighlightToIHighlight(storedHighlight)`

Converts a `StoredHighlight` from the database back to an `IHighlight` for rendering.

```typescript
StoredHighlightToIHighlight(storedHighlight: StoredHighlight): IHighlight
```

- Creates a `position` with `boundingRect` and a single-element `rects` array.
- Sets `comment.emoji` to a hardcoded search emoji.

---

## env.ts

**File:** `app/utils/env.ts`

Exports environment variable values.

| Export | Environment Variable | Default |
|--------|---------------------|---------|
| `supabaseUrl` | `SUPABASE_URL` | — |
| `supabaseKey` | `SUPABASE_ANON_KEY` | — |
| `googleClientId` | `GOOGLE_CLIENT_ID` | — |
| `googleClientSecret` | `GOOGLE_CLIENT_SECRET` | — |
| `storageMethod` | `STORAGE_METHOD` | `"sqlite"` |
