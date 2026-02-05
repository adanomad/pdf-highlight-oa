# Features

## PDF Upload and Viewing

Upload a PDF file to view it in the browser with full highlight support.

### How It Works

1. Click the **Upload PDF** button to select a `.pdf` file.
2. The application performs OCR on the first page using Tesseract.js, generating a searchable version of the PDF. This runs automatically on every upload.
3. The PDF renders in the main viewport using `react-pdf-highlighter`'s `PdfLoader` and `PdfHighlighter` components.
4. Any previously saved highlights for this PDF are loaded from the database.

### Technical Details

- The original PDF is displayed via `URL.createObjectURL()`.
- OCR produces a second PDF (`pdfOcrUrl`) used as a fallback for keyword search when the original PDF has no extractable text.
- The PDF identifier (`pdfId`) is derived from the filename using `getPdfId()`.

---

## Keyword Search and Highlighting

Search for words or phrases within the PDF and automatically highlight all matches.

### How It Works

1. After uploading a PDF, a search bar appears.
2. Enter one or more keywords separated by `|` (pipe character). For example: `contract|agreement|terms`.
3. Click the search button (magnifying glass icon).
4. All matches are highlighted in the PDF with bounding boxes.
5. Each highlight includes a comment showing the matched text (e.g., `Found "contract"`).

### Technical Details

- `searchPdf()` uses `pdfjs-dist` to extract text content from each page.
- Text items are grouped into lines by comparing y-coordinates.
- Keywords are matched using case-insensitive regex (`new RegExp(keyword, "gi")`).
- Bounding box coordinates are calculated from the text items' transform matrices.
- If no results are found in the original PDF, the OCR-processed PDF is searched as a fallback.
- New highlights are merged with existing ones (not replaced).
- All highlights are persisted to the database after each search.

### Clearing Highlights

Click the clear button (X icon) next to the search bar to remove all highlights from the current view.

---

## Manual Area Selection

Manually select rectangular areas on the PDF to create highlights with custom comments.

### How It Works

1. Hold the **Alt** key and click-drag on the PDF to select a rectangular area.
2. A tooltip appears — click to open the comment editor.
3. Enter a comment and confirm.
4. The area highlight is created with the selected region and your comment.

### Technical Details

- Area selection is enabled via `PdfHighlighter`'s `enableAreaSelection` prop, which checks `event.altKey`.
- The selected area captures a screenshot of the region (`content.image`).
- Area highlights can be resized after creation via `AreaHighlight`'s `onChange` handler.
- Area highlights are persisted to the database immediately on creation.

---

## OCR Processing

Automatic Optical Character Recognition makes scanned PDFs searchable.

### How It Works

1. When a PDF is uploaded, the first page is automatically converted to an image.
2. Tesseract.js processes the image to extract text.
3. The OCR output is converted back to a PDF (`pdfOcrUrl`).
4. If a keyword search finds no results in the original PDF, the OCR PDF is used as a fallback.

### Technical Details

- `convertPdfToImages()` renders PDF pages to a `<canvas>` element and exports as data URLs.
- A Tesseract.js web worker is created with the English (`"eng"`) language model.
- The worker produces a searchable PDF output (`res.data.pdf`).
- Word indexing (saving individual OCR words to the database) is implemented but currently commented out in the codebase.

---

## Export/Import Highlights as JSON

Save highlights to a JSON file and load them back later.

### Exporting

1. After creating highlights, click the **Download highlights** button.
2. A `highlights.json` file is downloaded containing all current highlights in `StoredHighlight[]` format.

### Importing

1. Click the **Upload highlights** button.
2. Select a `.json` file containing highlights in `StoredHighlight[]` format.
3. The highlights are loaded into the viewer and persisted to the database.

### JSON Format

Each highlight in the JSON array follows the `StoredHighlight` interface:

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

### Technical Details

- Export is client-side only — generates a `data:text/json` URL with `encodeURIComponent(JSON.stringify(...))`.
- Import reads the file via `URL.createObjectURL()` and `fetch()`, then converts each `StoredHighlight` to `IHighlight` using `StoredHighlightToIHighlight()`.
- Imported highlights replace (not merge with) existing highlights.
- The import/export UI is shown only when a `pdfId` is available (i.e., a PDF has been uploaded).

---

## Sidebar Navigation

Browse, navigate, and manage highlights through the sidebar panel.

### How It Works

1. The sidebar appears on the left side of the PDF viewer (visible on medium+ screens).
2. It displays the PDF filename at the top and lists all highlights below.
3. Click any highlight in the list to scroll the PDF viewer to that highlight.
4. Click the X button on a highlight to delete it.
5. Use the toggle button to collapse/expand the sidebar.

### Technical Details

- Clicking a highlight updates the URL hash to `#highlight-<id>` and calls `scrollViewerTo.current(highlight)`.
- The `App` component listens for `hashchange` events to handle scroll-to-highlight from URL hashes.
- Text highlights show the content text (truncated to 3 lines via `line-clamp-3`).
- Area highlights show the captured screenshot image.
- Deletion sends a `DELETE` request to `/api/highlight/update` and removes the highlight from state.
- The sidebar is hidden on small screens (`hidden md:block`).
