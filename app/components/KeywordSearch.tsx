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
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  resetHighlights,
}) => {
  return (
    <div className="flex space-x-2">
      <Input
        type="text"
        placeholder="Enter keyword to highlight"
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
  );
};

export default KeywordSearch;
