// app/components/App.tsx
"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
import { convertPdfToImages, getLines, getPdfId, getImagesIndividual } from "../utils/pdfUtils";
import type { IHighlight } from "react-pdf-highlighter";
import PdfUploader from "./PdfUploader";
import { StoredPdf, SearchResult, StoredImage } from "../utils/types";
import { StoredHighlightToIHighlight } from "../utils/utils";
import { clipText } from "../utils/clipText";
import { clipImage } from "../utils/clipImage";
import { tesseractRead } from "../utils/pdfUtils";
import localforage from "localforage";

export default function App() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [highlightsKey, setHighlightsKey] = useState(1);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const pdfViewerRef = useRef<any>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleFileUpload = async (file: File) => {

    setSidebarLoading(true);
    setViewerLoading(true);
    setLoadingMessage("Preparing PDF for embedding...");
    let currentZoom = 1;

    try {
      const fileUrl = URL.createObjectURL(file);
      const pdfId = getPdfId(file.name);
      const blob: Blob = await fetch(fileUrl).then(r => r.blob());

      const extractedText = await getLines(pdfId, fileUrl, currentZoom);
      const extractedImages = await getImagesIndividual(pdfId, fileUrl, currentZoom);
      
      const numPages = extractedText.length;
      let textToEmbed: any[] = new Array(numPages);

      const pdfObj = {
        id: pdfId,
        name: file.name,
        numPages: numPages,
        url: fileUrl,
      } as StoredPdf;

      localforage.setItem(pdfId, blob, function(err, result) {
        console.log(result.type);
      })

      const res = await fetch("/api/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfObj
        }),
      })
      if (!res.ok) {
        console.error("Error uploading PDF metadata.");
      }

      setViewerLoading(false);
      setPdfUrl(fileUrl);
      setPdfUploaded(true);
      setPdfName(file.name);
      setPdfId(pdfId);
      resetHighlights();

      const i: StoredImage[] = await convertPdfToImages(file);  

      //Perform OCR if no text is extracted
      if (extractedText.length === 0 || extractedText[0].length === 0 || extractedText[0][0].text === "") {
        setLoadingMessage("Performing OCR on PDF...");
        textToEmbed = await tesseractRead(i, pdfId, fileUrl); 
      } else { 
        textToEmbed = extractedText;
      }

      for (let j = 0; j < numPages; ++j) {
        setLoadingMessage(`Uploading embeddings for page ${j + 1} of ${numPages}`);
        let toApiArr = [];
        for (let k = 0; k < textToEmbed[j].length; ++k) {
          try {
            const embeddingObj = await clipText(textToEmbed[j][k].text);
            const embedding = JSON.stringify(Object.values(embeddingObj));

            toApiArr.push({
              pdfId: pdfId,
              embedding,
              pageNumber: j + 1,
              lineNumber: k + 1,
              StoredHighlight: textToEmbed[j][k],
            });

          } catch(err) {
            console.log(`Error uploading page ${j + 1} line ${k + 1}`);
          }
        }
        for (let l = 0; l < extractedImages[j].length; ++l) {
          try {
            const image = extractedImages[j][l].image;
            let embeddingObj;
            if (image/* && (textToEmbed[j].length == 0 
                        || textToEmbed[j][0].text === "" 
                        || Math.abs(extractedImages[j][l].height - i[j].height) > 10 
                        || Math.abs(extractedImages[j][l].width - i[j].width) > 10)*/) { //want to exclude text images already scanned with OCR
              embeddingObj = await clipImage(image);
              const embedding = JSON.stringify(Object.values(embeddingObj));

              toApiArr.push({
                pdfId: pdfId,
                embedding,
                pageNumber: j + 1,
                lineNumber: -1 * (l + 1),
                StoredHighlight: extractedImages[j][l],
              });
            }
          } catch(err) {
            console.log(`Error uploading page ${j + 1} line ${l + 1}`);
          }
        }
        if (toApiArr.length > 0) {
          const embeddingRes = await fetch("/api/index/embedding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toApiArr)
          })
          if (!embeddingRes.ok) {
            console.error("Error loading PDF embeddings.");
          }
        }
      }
    } catch (err) {
      console.error("Error processing PDF:", err);
      setViewerLoading(false);
    } finally {
      setLoadingMessage("Loading...");
      setSidebarLoading(false);
    }
  };

  const resetHighlights = () => {
    setHighlights((prevHighlights) => []);
  };

  const parseIdFromHash = () => {
    return document.location.hash.slice("#highlight-".length);
  };

  const resetHash = () => {
    document.location.hash = "";
  };

  const scrollViewerTo = useRef((highlight: IHighlight) => {
    if (pdfViewerRef.current && highlight) {
      pdfViewerRef.current.scrollTo(highlight);
    }
  });

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  useEffect(() => {
    const func = async () => {
      const highlightId = parseIdFromHash();

      if (highlights.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2400));

        const highlight = highlights.find((h) => h.id === highlightId);
        if (highlight) {
          scrollViewerTo.current(highlight);  
          setSidebarLoading(false);
        }
      }
    } 
    func();
  }, [highlights, pdfUrl])

  const scrollToHighlightFromHash = useCallback(() => {
    const highlightId = parseIdFromHash();
    if (highlights.length > 0) {
      const highlight = highlights.find((h) => h.id === highlightId);
      if (highlight) {
        scrollViewerTo.current(highlight);
      }
    }
  }, []);

  const updateHash = (highlight: IHighlight) => {
    document.location.hash = `highlight-${highlight.id}`;
  };

  const handleButtonClick = async (result: SearchResult) => {
    setSidebarLoading(true);
    const pdfIdNew = result.pdfPage.pdf ? result.pdfPage.pdf.id : "";
    if (pdfIdNew !== pdfId && pdfIdNew != "") {
      setPdfId(pdfIdNew);
      resetHighlights();
      try {
        await localforage.getItem(pdfIdNew)
        .then(async function (value: any) {
          const blob: Blob = value;
          const fileUrl = URL.createObjectURL(blob);
          setPdfUrl(fileUrl);
          setPdfName(result.pdfPage.pdf ? result.pdfPage.pdf.name : "");
          
        }, 
        function(error) {
          console.log("Error retrieving highlight data from localforage" + error);
          setViewerLoading(false);
        })
      } catch(err) {
        console.log("Error retrieving highlight data from localforage: " + err);
        setViewerLoading(false);
      }
    }
    
    if (pdfIdNew != "") {
      const highlightRes = await fetch(
        "/api/highlight/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: result.id
          }),
        });
      if (highlightRes.ok) {
        const highlightArr = await highlightRes.json();
        const iHighlight = StoredHighlightToIHighlight(highlightArr[0]);
        setHighlights(prev => [...prev, iHighlight]);
        updateHash(iHighlight);
      } else {
        console.log("Error getting highlights");
      }
    }    
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(120deg,_rgb(249_250_251)_50%,_rgb(239_246_255)_50%)]">
      <div className="flex-1">
        <div className="mb-8 sticky top-0">
          <Header />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 mb-8">
          <div className="max-w-xl mx-auto space-y-6">
            <PdfUploader
              onFileUpload={handleFileUpload}
              name={pdfName || ""}
              pdfUploaded={pdfUploaded}
            />
          </div>
          {viewerLoading ? (
            <div className="w-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <PdfViewer
              pdfUrl={pdfUrl}
              pdfName={pdfName}
              pdfId={pdfId}
              setPdfUrl={setPdfUrl}
              highlights={highlights}
              setHighlights={setHighlights}
              highlightsKey={highlightsKey}
              pdfViewerRef={pdfViewerRef}
              resetHash={resetHash}
              scrollViewerTo={scrollViewerTo}
              scrollToHighlightFromHash={scrollToHighlightFromHash}
              sideBarLoading={sidebarLoading}
              setSideBarLoading={setSidebarLoading}
              handleButtonClick={handleButtonClick}
              loadingMessage={loadingMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
