// app/components/Sidebar.tsx
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
  IHighlight, // Importing IHighlight type
} from "react-pdf-highlighter";
import { Button } from "./Button";
import { X } from "lucide-react";
import { debugMultiSearchEnabled, storageMethod } from "../utils/env";
import { StorageMethod, StoredHighlight } from "../utils/types";
import { StoredHighlightToIHighlight } from "../utils/utils";

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

const removeHighlight = (highlights: IHighlight[], id: string) => {
  return highlights.filter((h) => {
    return h.id !== id;
  });
};

const removeStoredHighlight = (storedHighlights: StoredHighlight[], id: string) => {
  return storedHighlights.filter((h) => {
    return h.id !== id;
  });
}

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
  highlights: Array<IHighlight>;
  storedHighlights: Array<StoredHighlight>;
  setHighlights: React.Dispatch<React.SetStateAction<Array<IHighlight>>>;
  setStoredHighlights: React.Dispatch<React.SetStateAction<Array<StoredHighlight>>>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  toggleSidebar: () => void;
  changeCurrentPdf: (pdfId: string) => void;
  sidebarIsOpen: boolean;
  pdfName: string;
  pdfId: string;
  scrollViewerTo: React.MutableRefObject<(highlight: IHighlight) => void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  highlights,
  storedHighlights,
  setHighlights,
  setStoredHighlights,
  resetHighlights,
  toggleDocument,
  sidebarIsOpen,
  toggleSidebar,
  changeCurrentPdf,
  pdfName,
  pdfId,
  scrollViewerTo,
}) => {
  return sidebarIsOpen ? (
    <div className="Sidebar h-full pl-2 pr-2 border-r-2 rounded-lg overflow-y-auto">
      <div className="sticky top-0 pt-2 bg-white border-b-2">
        <div className="w-full flow-root">
          <button
            className="float-left flex justify-center items-center"
            onClick={toggleSidebar}
          >
            <CloseIcon />
          </button>
          <div className="float-right flex justify-center items-center">
            <h1 className="text-lg font-bold">{pdfName}</h1>
          </div>
        </div>
      </div>
      <div>
      <ul>
          {highlights.map((highlight) => (
            <li key={highlight.id} className="border-t-2">
              <div
                onClick={() => {
                  updateHash(highlight);
                  scrollViewerTo.current(highlight);
                }}
                className="py-px cursor-pointer hover:bg-gray-100"
              >
                {highlight.content.text ? (
                  <blockquote className="text-sm font-bold line-clamp-3">
                    {highlight.content.text}
                  </blockquote>
                ) : null}
                {highlight.content.image ? (
                  <div
                    className="highlight__image"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img src={highlight.content.image} alt={"Screenshot"} />
                  </div>
                ) : null}
                <div className="pl-auto w-full flow-root align-middle">
                  <div className="flex float-left m-auto pt-1">
                    <p className="text-left text-sm italic">
                      Page {highlight.position.pageNumber}
                    </p>
                  </div>
                  <div className="float-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        const body =
                          storageMethod === StorageMethod.sqlite
                            ? {
                                pdfId: pdfId,
                                id: highlight.id,
                              }
                            : highlight.id;
                        await fetch("/api/highlight/update", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        });
                        if (debugMultiSearchEnabled) {
                          const newStoredHighlights = removeStoredHighlight(
                            storedHighlights,
                            highlight.id
                          );
                          setStoredHighlights([...newStoredHighlights]);
                        }
                        const newHighlights = removeHighlight(
                          highlights,
                          highlight.id
                        );
                        setHighlights([...newHighlights]);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {
          debugMultiSearchEnabled ? 
            (storedHighlights
            .reduce((acc, highlight) => {
              if (!acc.includes(highlight.pdfId) && !(highlight.pdfId === pdfId)) {
                acc.push(highlight.pdfId);
              }
              return acc;
            }, [] as string[])
            .map((acc) => {
              return ([
                <div className="flex justify-center items-center">
                  <h1 className="text-lg font-bold">{acc}</h1>
                </div>,
                <ul>
                  {
                    storedHighlights
                    .filter((highlight) => (highlight.pdfId === acc))
                    .map((highlight) => (
                      StoredHighlightToIHighlight(highlight)
                    ))
                    .map((highlight) => (
                      <li key={highlight.id} className="border-t-2">
                        <div
                          onClick={() => {
                            changeCurrentPdf(acc);
                            updateHash(highlight);
                            scrollViewerTo.current(highlight);
                          }}
                          className="py-px cursor-pointer hover:bg-gray-100"
                        >
                          {highlight.content.text ? (
                            <blockquote className="text-sm font-bold line-clamp-3">
                              {highlight.content.text}
                            </blockquote>
                          ) : null}
                          {highlight.content.image ? (
                            <div
                              className="highlight__image"
                              style={{ marginTop: "0.5rem" }}
                            >
                              <img src={highlight.content.image} alt={"Screenshot"} />
                            </div>
                          ) : null}
                          <div className="pl-auto w-full flow-root align-middle">
                            <div className="flex float-left m-auto pt-1">
                              <p className="text-left text-sm italic">
                                Page {highlight.position.pageNumber}
                              </p>
                            </div>
                            <div className="float-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  const body =
                                    storageMethod === StorageMethod.sqlite
                                      ? {
                                          pdfId: acc,
                                          id: highlight.id,
                                        }
                                      : highlight.id;
                                  await fetch("/api/highlight/update", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(body),
                                  });
                                  const newStoredHighlights = removeStoredHighlight(
                                    storedHighlights,
                                    highlight.id
                                  );
                                  setStoredHighlights([...newStoredHighlights]);
                                  const newHighlights = removeHighlight(
                                    highlights,
                                    highlight.id
                                  );
                                  setHighlights([...newHighlights]);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  }
                </ul>
              ]);
            })
          ) : (null)
        }
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
