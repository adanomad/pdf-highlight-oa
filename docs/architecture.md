# Architecture

## High-Level Overview

PDF Highlighter is a Next.js 14 application (App Router) that allows users to upload PDFs, search for keywords with automatic text highlighting, manually select areas, and persist highlights to a database.

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │PdfUploader│  │KeywordSearch │  │HighlightUpload│  │
│  └─────┬────┘  └──────┬───────┘  └──────┬────────┘  │
│        │              │                  │           │
│        ▼              ▼                  ▼           │
│  ┌─────────────────────────────────────────────┐     │
│  │              App (orchestrator)              │     │
│  │   state: pdfUrl, highlights, searchTerm,    │     │
│  │          pdfId, loading, pdfOcrUrl           │     │
│  └──────────────────┬──────────────────────────┘     │
│                     │                                │
│        ┌────────────┼────────────┐                   │
│        ▼            ▼            ▼                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐              │
│  │PdfViewer │ │ Sidebar  │ │ Spinner │              │
│  │(react-pdf│ │(highlight│ │         │              │
│  │-highlight│ │ list)    │ │         │              │
│  │er)       │ │          │ │         │              │
│  └──────────┘ └──────────┘ └─────────┘              │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │            pdfUtils (client-side)             │    │
│  │  searchPdf() ─ pdfjs-dist text extraction     │    │
│  │  convertPdfToImages() ─ canvas rendering      │    │
│  │  Tesseract.js OCR (in App component)          │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────┘
                       │  fetch() API calls
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Next.js API Routes                   │
│                                                      │
│  POST /api/highlight/get     ─ retrieve highlights   │
│  POST /api/highlight/update  ─ save highlights       │
│  DELETE /api/highlight/update ─ delete highlight      │
│  POST /api/index             ─ index OCR words       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Storage Abstraction Layer                │
│                                                      │
│  STORAGE_METHOD env var selects backend:             │
│                                                      │
│  ┌─────────────────┐     ┌──────────────────┐       │
│  │ HighlightStorage│     │  supabase.ts      │       │
│  │ (SQLite wrapper)│     │  (Supabase client)│       │
│  │                 │     │                   │       │
│  │ ┌─────────────┐ │     │  saveHighlight()  │       │
│  │ │SQLiteDatabase│ │     │  saveBulkH...()  │       │
│  │ │highlights.db │ │     │  getHighlights() │       │
│  │ └─────────────┘ │     │  deleteH...()    │       │
│  └─────────────────┘     └──────────────────┘       │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Upload and OCR

```
User selects PDF file
        │
        ▼
App.handleFileUpload()
        │
        ├─► URL.createObjectURL(file) → pdfUrl
        │
        ├─► convertPdfToImages(file)
        │       │
        │       ▼
        │   pdfjs-dist renders pages to <canvas>
        │   canvas.toDataURL() → base64 images
        │
        ├─► Tesseract.js worker.recognize(image)
        │       │
        │       ▼
        │   OCR output → new PDF blob → pdfOcrUrl
        │
        ├─► getPdfId(filename, email?) → pdfId
        │
        └─► fetch("/api/highlight/get") → load saved highlights
```

### Keyword Search

```
User enters keywords (pipe-separated: "word1|word2")
        │
        ▼
App.handleSearch()
        │
        ├─► searchPdf(keywords, pdfUrl, zoom)
        │       │
        │       ▼
        │   pdfjs-dist extracts text per page
        │   Groups text items into lines (by y-coordinate)
        │   Regex match keywords in each line
        │   Calculate bounding box coordinates
        │   Return IHighlight[] with positions
        │
        ├─► If no results and pdfOcrUrl exists:
        │       searchPdf(keywords, pdfOcrUrl, zoom)
        │
        ├─► Merge new highlights with existing
        │
        └─► POST /api/highlight/update → persist to DB
```

### Manual Area Selection

```
User holds Alt + clicks and drags on PDF
        │
        ▼
PdfHighlighter.enableAreaSelection(event.altKey)
        │
        ▼
onSelectionFinished(position, content)
        │
        ▼
<Tip> component → user enters comment
        │
        ▼
Create IHighlight with area position
        │
        ├─► POST /api/highlight/update → persist
        └─► setHighlights([...prev, newHighlight])
```

## Storage Abstraction

The application supports two storage backends, selected via the `STORAGE_METHOD` environment variable:

| Feature | SQLite | Supabase |
|---------|--------|----------|
| Setup | Zero-config, local file | Requires Supabase project |
| Location | `process.cwd()/highlights.db` | Cloud-hosted |
| Class/Module | `HighlightStorage` wrapping `SQLiteDatabase` | Individual exported functions |
| Word indexing | Supported | Not implemented |
| Export/Import | Client-side JSON | `exportToJson()` / `importFromJson()` server-side |

API routes check `storageMethod` and delegate to the appropriate backend. The SQLite path instantiates `HighlightStorage` (which creates an `SQLiteDatabase`), while the Supabase path calls standalone functions from `supabase.ts`.

## State Management

The application uses React hooks exclusively (no external state library). All top-level state lives in the `App` component:

| State | Type | Purpose |
|-------|------|---------|
| `pdfUploaded` | `boolean` | Whether a PDF has been uploaded |
| `pdfUrl` | `string \| null` | Object URL of the uploaded PDF |
| `pdfOcrUrl` | `string \| null` | Object URL of the OCR-processed PDF |
| `pdfName` | `string \| null` | Original filename |
| `pdfId` | `string \| null` | Derived identifier for DB storage |
| `searchTerm` | `string` | Current keyword search input |
| `highlights` | `IHighlight[]` | All current highlights |
| `highlightsKey` | `number` | Incremented to force `PdfHighlighter` re-render |
| `loading` | `boolean` | OCR processing indicator |

State flows down via props. Child components call parent callbacks (e.g., `onFileUpload`, `handleSearch`, `setHighlights`) to update state.

## Component Hierarchy

```
App
├── Header
├── PdfUploader
├── HighlightUploader  (shown when pdfId exists)
├── KeywordSearch      (shown when pdfUrl exists)
├── Spinner            (shown during loading)
└── PdfViewer
    ├── Sidebar
    │   └── Button (delete per highlight)
    └── PdfHighlighter (react-pdf-highlighter)
        ├── PdfLoader
        ├── Highlight / AreaHighlight
        ├── Popup
        │   └── HighlightPopup
        └── Tip (on selection)
```
