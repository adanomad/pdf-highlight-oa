// app/components/PdfViewer.tsx
import React from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  Tip,
} from "react-pdf-highlighter";
import Spinner from "./Spinner";
import HighlightPopup from "./HighlightPopup";
import type { IHighlight } from "react-pdf-highlighter";

interface PdfViewerProps {
  pdfUrl: string | null;
  highlights: Array<IHighlight>;
  setHighlights: React.Dispatch<React.SetStateAction<Array<IHighlight>>>;
  highlightsKey: number;
  pdfViewerRef: React.RefObject<any>;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  highlights,
  setHighlights,
  highlightsKey,
  pdfViewerRef,
}) => {
  if (!pdfUrl) {
    return <div className="text-center">No PDF uploaded</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 h-[calc(100vh-16rem)] overflow-y-auto">
      <div style={{ height: "100%", width: "100%", position: "relative" }}>
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
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  </Popup>
                );
              }}
              highlights={highlights}
              onScrollChange={() => {}}
              scrollRef={(scrollTo) => {}}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default PdfViewer;
