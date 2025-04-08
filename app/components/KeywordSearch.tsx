// app/components/KeywordSearch.tsx
import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Search, X, MessageSquare } from "lucide-react";

interface KeywordSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  resetHighlights: () => void;
  isChatSidebarOpen: boolean;
  setIsChatSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  resetHighlights,
  isChatSidebarOpen,
  setIsChatSidebarOpen,
}) => {

  const handleToggleChatSidebar = () => {
    setIsChatSidebarOpen((prevState) => !prevState); // Toggle the sidebar open/close
  };
  
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
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggleChatSidebar}
        aria-label={isChatSidebarOpen ? "Close chat" : "Open chat"}
        className="ml-2"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default KeywordSearch;
