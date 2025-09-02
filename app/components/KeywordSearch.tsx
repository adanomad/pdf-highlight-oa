// app/components/KeywordSearch.tsx
import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Search, X } from "lucide-react";

// interface KeywordSearchProps {
//   searchTerm: string;
//   setSearchTerm: (term: string) => void;
//   handleSearch: () => void;
//   resetHighlights: () => void;
// }

// const KeywordSearch: React.FC<KeywordSearchProps> = ({
//   searchTerm,
//   setSearchTerm,
//   handleSearch,
//   resetHighlights,
// }) => {

export default function KeywordSearch({
  term,
  setTerm,
  onSearch,
  onClear,
  mode,
  setMode,
}: {
  term: string;
  setTerm: (s: string) => void;
  onSearch: () => void;
  onClear: () => void;
  mode: "word" | "image";
  setMode: (m: "word" | "image") => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-2">
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={mode === "word" ? "Enter keyword…" : "Describe an image…"}
        />
        <Button variant="outline" onClick={onSearch} aria-label="Search">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onClear} aria-label="Clear">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant={mode === "word" ? "default" : "outline"} onClick={() => setMode("word")}>
          Word
        </Button>
        <Button variant={mode === "image" ? "default" : "outline"} onClick={() => setMode("image")}>
          Image
        </Button>
      </div>
    </div>
  );
};
