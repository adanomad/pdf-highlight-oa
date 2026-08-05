// app/components/KeywordSearch.tsx
import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Search, X } from "lucide-react";

interface PdfSearchProps {
  query: string;
  setQuery: (term: string) => void;
  handleSearch: () => void;
}

const PdfSearch: React.FC<PdfSearchProps> = ({
  query,
  setQuery,
  handleSearch,
}) => {
  return (
    <div className="flex space-x-2">
      <Input
        type="text"
        placeholder="Search PDFs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow"
      />
      <Button variant="outline" size="icon" onClick={handleSearch}>
        <Search className="w-4 h-4" />
        <span className="sr-only">Highlight</span>
      </Button>
    </div>
  );
};

export default PdfSearch;
