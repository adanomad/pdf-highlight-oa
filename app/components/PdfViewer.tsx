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
import { SearchResult } from "../utils/types";
import Spinner from "./Spinner";
import { Sidebar } from "./Sidebar";
import HighlightPopup from "./HighlightPopup";
import type {
  Content,
  IHighlight,
  ScaledPosition,
} from "react-pdf-highlighter";
import "../globals.css";

interface PdfViewerProps {
  pdfUrl: string | null;
  pdfName: string | null;
  pdfId: string | null;
  setPdfUrl: (url: string) => void;
  highlights: Array<IHighlight>;
  setHighlights: React.Dispatch<React.SetStateAction<Array<IHighlight>>>;
  highlightsKey: number;
  pdfViewerRef: React.RefObject<any>;
  resetHash: () => void;
  scrollViewerTo: React.MutableRefObject<(highlight: IHighlight) => void>;
  scrollToHighlightFromHash: () => void;
  sideBarLoading: boolean;
  setSideBarLoading: (sidebarLoading: boolean) => void;
  handleButtonClick: (result: SearchResult) => Promise<void>;
  loadingMessage: string; 
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  pdfName,
  pdfId,
  setPdfUrl,
  highlights,
  setHighlights,
  highlightsKey,
  pdfViewerRef,
  resetHash,
  scrollViewerTo,
  scrollToHighlightFromHash,
  sideBarLoading,
  setSideBarLoading,
  handleButtonClick,
  loadingMessage,
}) => {
  const [sidebarIsOpen, setSidebarIsOpen] = useState(true);

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
          Upload your PDFs to get started!
        </div>
        <Sidebar
          toggleSidebar={() => {
            setSidebarIsOpen(!sidebarIsOpen);
          }}
          sidebarIsOpen={sidebarIsOpen}
          pdfName={""}
          sidebarLoading={sideBarLoading}
          setSidebarLoading={setSideBarLoading}
          handleButtonClick={handleButtonClick}
          loadingMessage={loadingMessage}
        />
      </>
    );
  }
  return (
    <div className="bg-white shadow-lg rounded-lg h-[calc(100vh-16rem)] flex flex-row gap-2 justify-center">
      <div
        className={`${sidebarIsOpen ? "basis-[20%]" : "basis-[0%]"} md:block`}
      >
        {pdfName && pdfId && (
          <Sidebar
            toggleSidebar={() => {
              setSidebarIsOpen(!sidebarIsOpen);
            }}
            sidebarIsOpen={sidebarIsOpen}
            pdfName={pdfName}
            sidebarLoading={sideBarLoading}
            setSidebarLoading={setSideBarLoading}
            handleButtonClick={handleButtonClick}
            loadingMessage={loadingMessage}
          />
        )}
      </div>
      {pdfUrl ?
      (<div className="w-full h-full relative p-4 overflow-y-auto">
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
                console.log("Selection finished:", position, content);
                return (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {}}
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
                  <div
                    className="Highlight"
                    style={{ backgroundColor:'#2200ffff' }}
                  >
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
                  </div>
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
      </div>) :
      <></>
      }
      
    </div>
  );
};

export default PdfViewer;
