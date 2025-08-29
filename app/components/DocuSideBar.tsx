// app/components/DocuSidebar.tsx
import React from "react";

type Doc = { id: string; name: string; url: string };
type SearchHit = {
  document_id: string;
  document_name: string;
  url: string;
  page_number: number;
  kind: "text" | "image";
  distance: number; // lower is better
  similarity?: number; 
};

export default function DocuSidebar({
  documents,
  selectedId,
  onSelect,
  onDelete,
  onJumpToResult,
}: {
  documents: Doc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onJumpToResult?: (docId: string, url: string, pageNumber: number) => void;
}) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Debounced content search (embeddings) when user types in the sidebar
  React.useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setError(null);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // We use TEXT search for the sidebar box
        const r = await fetch(
          `/api/search?q=${encodeURIComponent(term)}&kind=text&limit=20`,
          { cache: "no-store" }
        );
        if (!r.ok) {
          const msg = await r.text().catch(() => "");
          throw new Error(msg || `HTTP ${r.status}`);
        }
        const rows = (await r.json()) as any[];

        // Normalize as needed (defensive)
        const hits: SearchHit[] = rows.map((row: any) => ({
          document_id:
            row.document_id ?? row.doc_id ?? row.pdf_id ?? row.file_id ?? row.id ?? "",
          document_name: row.document_name ?? row.name ?? row.title ?? "",
          url: row.url ?? "",
          page_number: typeof row.page_number === "number" ? row.page_number : row.page ?? 1,
          kind: (row.kind as "text" | "image") ?? "text",
          distance:
            typeof row.distance === "number"
              ? row.distance
              : typeof row.score === "number"
              ? row.score
              : typeof row.similarity === "number"
              ? row.similarity
              : 0,
        }));

        setResults(hits);
      } catch (e: any) {
        setError(e?.message ?? "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(t);
  }, [q]);

  // Keep file list filter by name (nice to have)
  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <aside className="h-screen w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto text-black sticky top-0">
      <h2 className="font-bold mb-3">Saved Documents</h2>

      {/* Sidebar search now queries embeddings + still filters names */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search document contents…"
        className="w-full border rounded px-2 py-1 mb-3 text-black placeholder-black"
        aria-label="Search document contents"
      />

      {/* Content search results */}
      {(loading || error || results.length > 0) && (
        <div className="mb-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Search Results</h3>
          {loading && <div className="text-sm text-gray-600">Searching…</div>}
          {error && <div className="text-sm text-red-600">Error: {error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="text-sm text-gray-600">No matches.</div>
          )}
          <ul className="space-y-2">
            {results.map((r, i) => {
            const sim =
              typeof r.similarity === "number"
                ? r.similarity
                : (typeof (r as any).score === "number" ? (r as any).score : 1 - (r.distance ?? 1));

            return (
              <li
                key={`${r.document_id}-${r.page_number}-${i}`}
                className="p-2 rounded bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100"
                onClick={() => onJumpToResult?.(r.document_id, r.url, r.page_number)}
                title={`${r.document_name} • page ${r.page_number}`}
              >
                <div className="text-sm font-medium truncate">{r.document_name}</div>
                <div className="text-xs text-gray-600">
                  Page {r.page_number} • {r.kind} • sim {sim.toFixed(3)}
                </div>
              </li>
            );
          })}
          </ul>
        </div>
      )}

      {/* File list */}
      <h3 className="font-semibold text-sm text-gray-700 mb-2">All Files</h3>
      <ul className="space-y-2">
        {filtered.map((doc) => (
          <li
            key={doc.id}
            className={`relative p-2 rounded cursor-pointer ${
              doc.id === selectedId ? "bg-blue-100" : "bg-gray-100"
            }`}
            onClick={() => onSelect(doc.id)}
            title={doc.name}
          >
            <div className="truncate pr-7">{doc.name}</div>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
              aria-label="Delete"
              title="Delete"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
