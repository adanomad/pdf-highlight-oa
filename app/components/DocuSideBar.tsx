// app/components/DocuSidebar.tsx
import React from "react";

type Doc = { id: string; name: string; url: string };

export default function DocuSidebar({
  documents,
  selectedId,
  onSelect,
  onDelete,
}: {
  documents: Doc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const filtered = documents.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside className="absolute right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="font-bold mb-3">Saved Documents</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search docs..."
        className="w-full border rounded px-2 py-1 mb-3"
      />
      <ul className="space-y-2">
        {filtered.map((doc) => (
          <li
            key={doc.id}
            className={`relative p-2 rounded cursor-pointer ${doc.id === selectedId ? "bg-blue-100" : "bg-gray-100"}`}
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
