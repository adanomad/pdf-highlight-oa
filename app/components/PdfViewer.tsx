// app/components/PdfViewer.tsx
import React, { useState } from "react";
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
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
                );
                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={() =>
                      setTip(highlight, (highlight) => (
                        <HighlightPopup {...highlight} />
                      ))
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
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
