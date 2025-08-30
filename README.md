# PDF Highlighter 

## Project Overview

This project is a PDF viewer and keyword search application developed as part of the Adanomad Tech Consulting Challenge. It allows users to upload PDF documents, view them in a web browser, search for keywords, and highlight matching text.

# Set it up Yourself!

## Prerequisites

* Node 18+
* Supabase project (URL + anon key + service role key)
* OpenAI API key

---

## 1) Supabase Setup

### 1.1 Create a public bucket

Create a bucket named **`pdfs`** (public). This stores uploaded PDFs.

### 1.2 Create the `highlights` table

Paste in Supabase SQL editor:

```sql
create table if not exists public.highlights (
  id         text primary key,
  pdf_id     text not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists highlights_pdfid_idx on public.highlights (pdf_id);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_highlights_updated on public.highlights;
create trigger trg_highlights_updated
before update on public.highlights
for each row execute function set_updated_at();

-- Refresh API cache
notify pgrst, 'reload schema';
```

> We store the whole highlight object in `data` (JSONB) → no schema drift.

---

## 2) Environment Variables

### 2.1 `.env` (server)

```bash
# Storage backend toggle
STORAGE_METHOD="supabase"   # or "sqlite"

# Supabase (server)
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY="eyJ..."           # optional, server can also use this
SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # REQUIRED on server for table writes

# OpenAI
OPENAI_API_KEY="sk-..."

# Optional: SQLite file location (defaults to ./data/highlights.db)
# SQLITE_PATH="/absolute/path/app.db"
```

### 2.2 `.env.local` (browser)

```bash
NEXT_PUBLIC_STORAGE_METHOD="supabase"

# Supabase (client upload to Storage)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

> Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.

---

## 3) Install & Run

```bash
npm i
# If not already installed in your project:
npm i @supabase/supabase-js openai better-sqlite3

npm run dev
```

---

## 4) How It Works (Flow)

1. **Upload PDF**
   `App.tsx` generates a `pdfId`, uploads the file to `pdfs/uploads/{pdfId}/…` (Supabase Storage), and uses a blob URL for instant preview.

2. **Highlights Persistence**
   `/api/highlight/get` & `/api/highlight/update` read/write the `public.highlights` table.
   We save the entire highlight object in `data` (JSONB), keyed by `id` + `pdf_id`.

3. **Page-Level Semantic Index (Local)**
   On upload, `App.tsx` extracts **page text** (prefers embedded text; OCR only image-only pages) and calls
   `/api/semantic/index` → builds an SQLite table:

   ```
   page_embeddings(pdfId TEXT, page INTEGER, text TEXT, embedding TEXT JSON, PRIMARY KEY(pdfId,page))
   ```

   No vectors are stored in Supabase.

4. **Search (Keyword + Vectors)**

   * Keyword: iterate every loaded PDF (`docs`) and run `searchPdf` on each file (fallback to OCR PDF if needed).
   * Vector: `/api/semantic/query` embeds the query once and cosine-matches against **page** embeddings in SQLite.
     For each hit page, probe words localize the exact rectangle in the viewer.

5. **Multi-PDF UX**
   Results are aggregated into one `highlights` list and each hit is tagged with its owner `pdfId`; clicking auto-switches PDFs and scrolls to the match.

---



## 8) Security Notes

* Keep `SUPABASE_SERVICE_ROLE_KEY` **server-only**.
* The `pdfs` bucket is public by design (for easy viewing). If you need private access, switch to signed URLs and gate access in API routes.

---


# Implementations

Firstly before I start I'd like apologize for how long I took to solve this OA, on top of starting late I also managed to convince myself that the future improvements section here is what I had to implement. Let's just say, attempting to have a drawable canvas over a PDF while using react-pdf-highlighter and maintaining mobile-friendly code is **NOT** fun. 

1. Multi-pdf support with keyword search supported amongst both.

https://github.com/user-attachments/assets/244404b6-5372-4829-8c3a-316dadec60c4

- Every uploaded PDF is tracked in a docs map ({pdfId → {name, fileUrl, ocrUrl}}).

- On search, the app iterates all docs, runs searchPdf(keywords, fileUrl) (falls back to ocrUrl if no text layer), and aggregates all matches into one highlights list.

- Each hit is tagged with its owning pdfId (highlightOwner[id] = pdfId), so clicking a result auto-switches to that PDF and scrolls to the rect.

- If keywords find nothing (or query starts with ~), it uses page-level semantic hits to pick a page, then re-localizes with a tiny keyword search on that page.


2. Searchable embedded vectors

https://github.com/user-attachments/assets/82b9d6c4-751f-4e89-be80-4ed2c72f96ca

Do note that this is simply a very rough implementation of indexing/implementing searchable-vectors, obviously with a more precise model and more queries to the model, it'd be a LOT more precise. Do also note that this feature and the next one are both very intertwined and reflective of each other. 

- On upload, it extracts text per page (prefer the PDF text layer; OCR only if needed), then create page embeddings with text-embedding-3-small (1536-d).

- Those vectors are stored locally in SQLite alongside the page text and pdfId.

- On search, it embeds the query once, computes cosine similarity against all stored page vectors, and then returns the top pages.

- For each hit page, it pulls a few probe words from its text to quickly re-locate and draws an exact highlight in the viewer.


3. Page level indexing

- It indexes one vector per page: on upload it extracts each page’s text (use the PDF text layer when present; if a page is image-only, we OCR just that page) and store {pdfId, page, text, embedding} in SQLite.

- Page-level keeps vectors small and localized, so huge PDFs are searchable without giant, single-document embeddings.

- On search, it embeds the query once, then computes cosine similarity against all page vectors, and return the best pages.

- For each hit page, it grabs a few probe words from its text to quickly re-locate and draw an exact highlight in the viewer—even when the original PDF was entirely images.


4. PDF upload to supabase and relevant schema


https://github.com/user-attachments/assets/76e682d7-597e-465c-aa33-256ddd64628c

Note that there are several uploads of the same document (the drylabs one since I used it several times across these demos). This is for possible future implementation of version control/several "sets" of annotations for one document. 

- Upload: On file drop, it creates a pdfId and upload the PDF to Supabase Storage (pdfs/uploads/{pdfId}/…); a blob URL is used for instant preview.

- Highlights schema (DB): Supabase table highlights(id text, pdf_id text, data jsonb, created_at, updated_at); routes /api/highlight/get|update read/write it.

- Search index (local): SQLite table page_embeddings(pdfId, page, text, embedding-json) built on upload (page text or OCR → per-page embedding); /api/semantic/index|query manage/query it.

- Result: PDFs are stored, highlights persisted, and large/image-only docs are searchable via page-level embeddings.


# Issues I faced

* **Cross-PDF results + navigation (no idea at first).**
  I didn’t know how to show hits from multiple files and still scroll to the right spot. solution: keep a `docs` registry, tag every result with `highlightOwner[id] = pdfId`, and on click/hashchange: if owner ≠ current doc → `switchDoc(owner)` then `scrollTo`. added `searchMode` to hide normal marks while showing search hits. I've had so many issues with this especially with `react-pdf-highlighter` I had to restart the challenge 3 times.

* **Vector hit → exact rectangle (how?!).**
  embeddings only tell you the **page**, not the box. I solved it by doing **page-level embeddings** (one per page), then for each hit it picks probe words from that page’s text and run a tiny keyword search **on that page** to localize a real rectangle (`chooseBestLocalizedHighlight()`).


* **Viewer tweaks we had to make (not obvious up front).**
  This alongside the next issue was really annoying, as it felt like any slight change to the UI/format of the PDFviewer would make `react-pdf-highlighter` explode.

* **docs ARE thin.**
  `react-pdf-highlighter` is barely documented, so I learned from community examples and its source to learn the `IHighlight` contract and the viewport math. that’s what finally unlocked reliable boxes + scrolling.


**Everything below this point is from the original README.md**

## Features

- PDF document upload and display
- Page navigation (next, previous, jump to specific page)
- Zoom in/out functionality
- Document information display (total pages, current page)
- Keyword search across the entire PDF
- Text highlighting for search matches
- Sidebar for search results and navigation
- Responsive design for various screen sizes
- Persistent storage of highlights using SQLite or Supabase

## Technologies Used

- Next.js
- React 
- TypeScript
- react-pdf library for PDF rendering
- Tailwind CSS for stylinge
- SQLite for local highlight storage
- Supabase for cloud-based highlight storage (optional)

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/page.js`: Main entry point of the application
- `app/components/`: React components for various parts of the application
- `app/utils/`: Utility functions for PDF processing and highlight storage
- `app/styles/`: CSS files for styling
- `app/api/`: API routes for handling highlight operations

## Key Components

- `App.tsx`: Core application component
- `PdfViewer.tsx`: Handles PDF rendering and navigation
- `KeywordSearch.tsx`: Manages keyword search functionality
- `HighlightPopup.tsx`: Displays information about highlighted text
- `Sidebar.tsx`: Shows search results and navigation options
- `highlightStorage.ts`: Manages highlight storage operations
- `sqliteUtils.ts`: Handles SQLite database operations

## Features

- Has a highlight storage system supporting both SQLite and Supabase
- API routes for creating, retrieving, updating, and deleting highlights
- User authentication and document permissions (currently disabled)
- Export/import as JSON functionality for highlights
- Scroll the sidebar highlighted area into view across different PDFs. 


## Future Improvements

- Implement annotation tools (e.g., freehand drawing, text notes)
- Add support for multiple document search
- Pre-process batch PDFs for quicker highlights
- Enhance mobile responsiveness for better small-screen experience
- Optimize performance for large PDF files
- Upload the PDF into the database.

## License

[MIT License](https://opensource.org/licenses/MIT)

## Acknowledgements

- [Next.js](https://nextjs.org/) for the React framework
- [SQLite](https://www.sqlite.org/) for local database storage
- [Supabase](https://supabase.io/) for cloud database capabilities
- [react-pdf](https://github.com/wojtekmaj/react-pdf) for PDF rendering capabilities
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework
