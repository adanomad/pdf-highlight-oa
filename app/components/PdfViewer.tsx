// app/components/PdfViewer.tsx
import React, { useState, useEffect } from "react";
import {
  AreaHighlight,
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  Tip,
} from "react-pdf-highlighter";
// import { useSession } from "next-auth/react";
import Spinner from "./Spinner";
import { Sidebar } from "./Sidebar";
import HighlightPopup from "./HighlightPopup";
import type {
  Content,
  IHighlight,
  ScaledPosition,
} from "react-pdf-highlighter";
import { IHighlightToStoredHighlight } from "../utils/utils";
import * as pdfjs from "pdfjs-dist";
import { version as pdfJsVersion } from "pdfjs-dist/package.json";

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

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  pdfName,
  pdfId,
  highlights,
  setHighlights,
  highlightsKey,
  pdfViewerRef,
  resetHash,
  scrollViewerTo,
  scrollToHighlightFromHash,
}) => {
  const [sidebarIsOpen, setSidebarIsOpen] = useState(true);
  // const session = useSession();

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>
  ) => {
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      })
    );
  };

  useEffect(() => {
    // Create an in-memory worker using a blob URL - no external fetching needed
    if (typeof window !== 'undefined') {
      try {
        // Get the worker code from the locally installed package
        import('pdfjs-dist/build/pdf.worker.mjs').then((workerModule) => {
          // The actual code is in workerModule.default
          const workerCode = workerModule.default;
          
          // Create a blob URL from the worker code
          const workerBlob = new Blob([workerCode], { type: 'text/javascript' });
          const workerUrl = URL.createObjectURL(workerBlob);
          
          // Set the worker source
          pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
          console.log("PDF worker set using local blob URL");
        }).catch(err => {
          console.error("Failed to import worker:", err);
          // Fallback to a simple worker implementation
          setupFallbackWorker();
        });
      } catch (error) {
        console.error("Error creating worker:", error);
        // Fallback to a simple worker implementation
        setupFallbackWorker();
      }
    }
  }, []);

  // Fallback worker function
  const setupFallbackWorker = () => {
    // Create a minimal worker script
    const workerScript = `
      self.onmessage = function(event) {
        // Just echo back messages for now - this is a minimal worker
        self.postMessage({
          type: 'test',
          success: true,
          message: 'Minimal worker running'
        });
      };
    `;
    
    const blob = new Blob([workerScript], { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    // Set the worker source
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log("PDF worker set using fallback minimal worker");
  };

  if (!pdfUrl) {
    return (
      <>
        <div className="text-center font-bold text-md">
          Upload your PDF to start highlighting!
        </div>
        {/* {session.status !== "authenticated" && (
          <div className="bg-white shadow-lg rounded-lg h-[calc(100vh-16rem)] flex flex-row gap-2 justify-center">
            <img
              src="demo.png"
              className="rounded-lg object-cover w-full hover:scale-[1.05] transform transition duration-500"
            />
          </div>
        )} */}
      </>
    );
  }
  return (
    <div className="bg-white shadow-lg rounded-lg h-[calc(100vh-16rem)] flex flex-row gap-2 justify-center">
      <div
        className={`${sidebarIsOpen ? "basis-[20%]" : "basis-[0%]"} hidden md:block`}
      >
        {pdfName && pdfId && (
          <Sidebar
            highlights={highlights}
            setHighlights={setHighlights}
            resetHighlights={() => {
              setHighlights([]);
            }}
            toggleDocument={() => {}}
            toggleSidebar={() => {
              setSidebarIsOpen(!sidebarIsOpen);
            }}
            sidebarIsOpen={sidebarIsOpen}
            pdfName={pdfName}
            pdfId={pdfId}
            scrollViewerTo={scrollViewerTo}
          />
        )}
      </div>
      <div className="w-full h-full relative p-4 overflow-y-auto">
        <PdfLoader
          url={pdfUrl}
          beforeLoad={<Spinner />}
          onError={(error) => console.error("Error loading PDF:", error)}
        >
          {(pdfDocument) => (
            <PdfHighlighter
              ref={pdfViewerRef}
              key={highlightsKey}
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection
              ) => {
                return (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      const newHighlight = {
                        content,
                        position,
                        comment,
                        id: Date.now().toString(),
                      };
                      if (pdfName) {
                        const sh = IHighlightToStoredHighlight(
                          newHighlight,
                          pdfName
                        );
                        fetch("/api/highlight/update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(sh),
                        });
                      }
                      setHighlights((prev) => [...prev, newHighlight]);
                      hideTipAndSelection();
                    }}
                  />
                );
              }}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !highlight.content?.image;
                const component = isTextHighlight ? (
                  <Highlight
                    id={highlight.id}
                    position={highlight.position}
                    content={highlight.content}
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                  />
                ) : (
                  <AreaHighlight
                    id={highlight.id}
                    highlight={highlight}
                    isScrolledTo={isScrolledTo}
                  />
                );
                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight.content} />}
                    onMouseOver={(popupContent) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                    children={component}
                  />
                );
              }}
              highlights={highlights}
              onScrollChange={resetHash}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo;
                scrollToHighlightFromHash();
              }}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default PdfViewer;
