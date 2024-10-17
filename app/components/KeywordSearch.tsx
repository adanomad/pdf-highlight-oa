// app/components/KeywordSearch.tsx
import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Search, X } from "lucide-react";

interface KeywordSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  resetHighlights: () => void;
  mode: "word" | "image";
  setMode: (mode: "word" | "image") => void;
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  resetHighlights,
  mode,
  setMode,
}) => {
  return (
    <div className="flex space-x-4 items-center">
      {/* Input for the search term */}
      <div className="flex w-3/4 space-x-1">
        <Input
          type="text"
          placeholder={
            mode === "word"
              ? "Enter keyword to highlight"
              : "Enter image keyword to search"
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="w-4 h-4" />
          <span className="sr-only">Highlight</span>
        </Button>
        <Button variant="outline" size="icon" onClick={resetHighlights}>
          <X className="w-4 h-4" />
          <span className="sr-only">Clear Highlights</span>
        </Button>
      </div>

      {/* Toggle between word and image search modes */}
      <Button
        variant={mode === "word" ? "default" : "outline"}
        onClick={() => setMode("word")}
      >
        Word Search
      </Button>
      <Button
        variant={mode === "image" ? "default" : "outline"}
        onClick={() => setMode("image")}
      >
        Image Search
      </Button>
    </div>

  );
};


export default KeywordSearch;
