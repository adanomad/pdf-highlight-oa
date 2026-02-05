# Components

All components are located in `app/components/`.

## App

**File:** `app/components/App.tsx`

The root orchestrator component. Manages all top-level application state and coordinates the upload, OCR, search, and highlight persistence workflows.

### State

| State | Type | Description |
|-------|------|-------------|
| `pdfUploaded` | `boolean` | Whether a PDF file has been uploaded |
| `pdfUrl` | `string \| null` | Object URL of the original uploaded PDF |
| `pdfOcrUrl` | `string \| null` | Object URL of the OCR-processed PDF |
| `pdfName` | `string \| null` | Original filename of the uploaded PDF |
| `pdfId` | `string \| null` | Derived identifier used for database storage |
| `searchTerm` | `string` | Current keyword search input |
| `highlights` | `IHighlight[]` | All active highlights |
| `highlightsKey` | `number` | Incremented on highlight changes to force PdfHighlighter re-render |
| `loading` | `boolean` | `true` during OCR processing |

### Key Behaviors

- On file upload: creates an object URL, runs OCR via Tesseract.js, generates a `pdfId`, and loads any saved highlights from the API.
- On search: splits the search term by `|` to support multiple keywords, calls `searchPdf()`, falls back to the OCR PDF if no results, merges results with existing highlights, and persists to the database.
- On highlight upload (JSON): reads the file, converts `StoredHighlight[]` to `IHighlight[]`, updates state, and persists to the database.
- Listens for `hashchange` events to scroll to highlights referenced by URL hash (`#highlight-<id>`).

---

## PdfViewer

**File:** `app/components/PdfViewer.tsx`

Renders the PDF document and handles highlight display and interaction using the `react-pdf-highlighter` library.

### Props

```typescript
interface PdfViewerProps {
  pdfUrl: string | null;
  pdfName: string | null;
  pdfId: string | null;
  highlights: Array<IHighlight>;
  setHighlights: React.Dispatch<React.SetStateAction<Array<IHighlight>>>;
  highlightsKey: number;
  pdfViewerRef: React.RefObject<any>;
  resetHash: () => void;
  scrollViewerTo: React.MutableRefObject<(highlight: IHighlight) => void>;
  scrollToHighlightFromHash: () => void;
}
```

### Key Behaviors

- When `pdfUrl` is `null`, displays a prompt to upload a PDF.
- Area selection is enabled by holding the `Alt` key (`enableAreaSelection: event.altKey`).
- On text/area selection finish, shows a `<Tip>` component for adding a comment, then persists the highlight via the API.
- Renders text highlights with `<Highlight>` and area highlights with `<AreaHighlight>`.
- Hover popups display the highlight comment via `<HighlightPopup>`.
- Contains a collapsible `<Sidebar>` for managing highlights.

---

## PdfUploader

**File:** `app/components/PdfUploader.tsx`

File input component for uploading PDF files.

### Props

```typescript
interface PdfUploaderProps {
  onFileUpload: (file: File) => void;
  pdfUploaded: boolean;
}
```

### Key Behaviors

- Renders a hidden `<input type="file" accept=".pdf">` with a styled `<Button>` label.
- Button text changes from "Upload PDF" to "PDF Uploaded" after a file is selected.
- Calls `onFileUpload` with the selected `File` object.

---

## KeywordSearch

**File:** `app/components/KeywordSearch.tsx`

Search interface for entering keywords to highlight in the PDF.

### Props

```typescript
interface KeywordSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  resetHighlights: () => void;
}
```

### Key Behaviors

- Text input with placeholder "Enter keyword to highlight".
- Search button (magnifying glass icon) triggers `handleSearch`.
- Clear button (X icon) triggers `resetHighlights` to remove all highlights.
- Multiple keywords can be entered separated by `|` (pipe character).

---

## HighlightUploader

**File:** `app/components/HighlightUploader.tsx`

Dual-purpose component for importing highlights from JSON and exporting current highlights as JSON.

### Props

```typescript
interface HighlightUploader {
  onFileUpload: (file: File) => void;
  highlights: IHighlight[];
  pdfId: string;
}
```

### Key Behaviors

- **Upload:** Hidden `<input type="file" accept=".json">` with a styled button. Calls `onFileUpload` with the selected file.
- **Download:** An `<a>` tag with a `data:text/json` href containing the current highlights converted to `StoredHighlight[]` format via `IHighlightToStoredHighlight()`. Downloads as `highlights.json`.

---

## HighlightPopup

**File:** `app/components/HighlightPopup.tsx`

Tooltip popup displayed when hovering over a highlight.

### Props

```typescript
interface HighlightPopupProps {
  comment: { text: string; emoji: string };
}
```

### Key Behaviors

- Renders the comment emoji and text inside a div with class `Highlight__popup`.
- Returns `null` if `comment.text` is empty/falsy.

---

## Sidebar

**File:** `app/components/Sidebar.tsx`

Collapsible sidebar showing the list of all highlights with navigation and deletion.

### Props

```typescript
interface SidebarProps {
  highlights: Array<IHighlight>;
  setHighlights: React.Dispatch<React.SetStateAction<Array<IHighlight>>>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  toggleSidebar: () => void;
  sidebarIsOpen: boolean;
  pdfName: string;
  pdfId: string;
  scrollViewerTo: React.MutableRefObject<(highlight: IHighlight) => void>;
}
```

### Key Behaviors

- When open, displays the PDF filename in the header and a scrollable list of highlights.
- Each highlight item shows the content text (truncated to 3 lines) or a screenshot image for area highlights.
- Displays the page number for each highlight.
- Clicking a highlight scrolls the viewer to that highlight and updates the URL hash.
- Delete button (X icon) removes the highlight from state and sends a `DELETE` request to the API.
- Toggle button with open/close icons to collapse/expand the sidebar.
- Hidden on small screens (`hidden md:block`).

---

## Header

**File:** `app/components/Header.tsx`

Application header bar.

### Props

```typescript
interface HeaderProps {}
```

### Key Behaviors

- Displays the title "Adanomad Challenge" with bold styling and underline.
- Contains commented-out Google authentication sign-in/sign-out UI (using NextAuth).

---

## Button

**File:** `app/components/Button.tsx`

Reusable button component with variant and size support.

### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "icon";
  as?: React.ElementType;
}
```

### Variants

| Variant | Styles |
|---------|--------|
| `default` | Blue background, white text |
| `outline` | Gray border, gray text, hover background |
| `ghost` | Transparent background, gray text, hover background |

### Sizes

| Size | Styles |
|------|--------|
| `default` | `px-4 py-2 text-sm` |
| `icon` | `p-2 text-base` |

The `as` prop allows rendering as a different element (e.g., `<span>` for use inside `<label>`).

---

## Input

**File:** `app/components/Input.tsx`

Reusable input component extending native HTML input attributes.

### Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

### Key Behaviors

- Applies base styles: border, rounded corners, blue focus ring.
- Passes through all standard HTML input attributes.

---

## Spinner

**File:** `app/components/Spinner.tsx`

Loading indicator component.

### Props

None.

### Key Behaviors

- Renders an animated SVG spinner with blue fill.
- Includes `aria-hidden="true"` on the SVG and a `sr-only` "Loading..." text for accessibility.
