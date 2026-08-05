// app/components/Sidebar.tsx
import { useState } from "react";
import { Button } from "./Button";
import { SearchResult, ResultAndHighlight } from "../utils/types";
import PdfSearch from "./PdfSearch";
import Spinner from "./Spinner";
import { clipText } from "../utils/clipText";

const OpenIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="M13 8l4 4-4 4" />
    </svg>
  );
};

const CloseIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="M17 16l-4-4 4-4" />
    </svg>
  );
};

interface SidebarProps {
  sidebarIsOpen: boolean;
  toggleSidebar: () => void;
  pdfName: string;
  sidebarLoading: boolean;
  setSidebarLoading: (sidebarLoading: boolean) => void;
  handleButtonClick: (result: SearchResult) => Promise<void>;
  loadingMessage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarIsOpen,
  toggleSidebar,
  pdfName,
  sidebarLoading,
  setSidebarLoading,
  handleButtonClick,
  loadingMessage,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchResultsWithHighlights, setSearchResultsWithHighlights] = useState<ResultAndHighlight[]>([]);

  const handleQuery = async () => {
        if (query) {
          setSidebarLoading(true);
          const queryEmbedding = await clipText(query);
          const embedding = JSON.stringify(Object.values(queryEmbedding));
          const res = await fetch("/api/pdf/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              queryToEmbed: embedding
            }),
          });
          if (res.ok) {
            const results: SearchResult[] = await res.json();
            if (results === null) {
              setSearchResults([]);
              throw("No PDFs uploaded yet!");
              return;
            }
            setSearchResults(results);
            let resultsWithHighlights: ResultAndHighlight[] = new Array(results.length);
            for (let i = 0; i < results.length; ++i) {
              const highlightRes = await fetch("/api/highlight/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: results[i].id
                }),
              });
              if (highlightRes.ok) {
                const highlight = await highlightRes.json();
                resultsWithHighlights[i] = {result: results[i], highlight: highlight[0]};
              } else {
                console.log("Failed to fetch highlights");
                throw("Failed to fetch highlights: " + res.statusText);
              }
            }
            setSearchResultsWithHighlights(resultsWithHighlights);
          } else {
            console.log("Failed to search PDFs: ", res.statusText);
            throw("Failed to search PDFs: "+ res.statusText);
          }
          setSidebarLoading(false);
        } else {
          console.log("Invalid query!");
        }
      }

  return sidebarIsOpen ? (
    <div className="Sidebar h-full pl-2 pr-2 border-r-2 rounded-lg overflow-y-auto">
      <div className="sticky top-0 pt-2 bg-white border-b-2">
        <div className="w-full flow-root">
          <button
            className="float-left flex justify-center items-center m-4"
            onClick={toggleSidebar}
          >
            <CloseIcon />
          </button>
          <div className="float-right flex justify-center items-center">
            <h1 className="text-lg font-bold">{pdfName}</h1>
          </div>
        </div>
        <div className="flex flex-col">
          {sidebarLoading ? (
            <div className="w-full flex flex-col items-center justify-center">
              <p className="mt-4">{loadingMessage}</p>
              <Spinner />
            </div>
          ) : (
            <div>
              <div className="m-4">
                <PdfSearch
                  query={query}
                  setQuery={setQuery}
                  handleSearch={handleQuery}
                >
                </PdfSearch>
              </div>
              <div className="flex flex-col items-center gap-0">
                {
                  searchResultsWithHighlights.map((resultWithHighlight, i) => {
                    return (
                      <Button variant="outline" key={i} onClick={async () => await handleButtonClick(searchResults[i])} className="m-4 flex-col">
                        <p className={`text-md text-black ${resultWithHighlight.highlight.image ? "" : "italic"}`}>
                          {resultWithHighlight.highlight.image ? "IMAGE" : `${resultWithHighlight.highlight.text}`}
                        </p>
                        <br></br>
                        <p className="text-xs">
                          {resultWithHighlight.result.pdfPage.pdf ? resultWithHighlight.result.pdfPage.pdf.name + "  pg." + resultWithHighlight.result.pdfPage.pageNumber : ""}
                        </p>
                        <p className="text-xs">
                          Vector Distance: {resultWithHighlight.result.distance}
                        </p>
                      </Button>
                  )})
                }
                <div className="w-fit p-4">
                </div>              
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="Sidebar pl-2 pr-2 shadow-md rounded-lg overflow-y-auto">
      <div
        className={`sticky top-0 pt-2 bg-white ${sidebarIsOpen ? "border-b-2" : "border-0"}`}
      >
        <button onClick={toggleSidebar}>
          <OpenIcon />
        </button>
      </div>
    </div>
  );
};
