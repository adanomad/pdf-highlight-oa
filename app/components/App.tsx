// app/components/App.tsx
"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfUploader from "./PdfUploader";
import KeywordSearch from "./KeywordSearch";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
import { convertPdfToImages, searchPdf } from "../utils/pdfUtils";
import type { IHighlight } from "react-pdf-highlighter";
import HighlightUploader from "./HighlightUploader";
import { StoredHighlight, StorageMethod } from "../utils/types";
import {
  IHighlightToStoredHighlight,
  StoredHighlightToIHighlight,
} from "../utils/utils";
import { createWorker } from "tesseract.js";
// import { useSession } from "next-auth/react";
import { getPdfId } from "../utils/pdfUtils";
import { storageMethod } from "../utils/env";
import DeleteAll from "./DeleteAll"

export default function App() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOcrUrl, setPdfOcrUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [highlightUrl, setHighlightUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [highlightsKey, setHighlightsKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const pdfViewerRef = useRef<any>(null);

  // const session = useSession();

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append("file", file);
    });
  
    try {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        console.error(uploadResponse);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPdfUploaded(true);
      setLoading(false);
      setRefreshData(prev => !prev);
    }
  };  

  useEffect(() => {
    const getHighlights = async () => {
      if (!pdfName) {
        return;
      }
      const res = await fetch("/api/highlight/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfId),
      });
      if (res.ok) {
        const resHighlights = await res.json();
        console.log("getHighlights", pdfId, resHighlights);
        if (resHighlights) {
          const highlights = resHighlights.map(
            (storedHighlight: StoredHighlight) => {
              return StoredHighlightToIHighlight(storedHighlight);
            }
          );
          setHighlights(highlights);
        }
      }
    };
    getHighlights();
  }, [pdfName, pdfId]);

  const handleHighlightUpload = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setHighlightUrl(fileUrl);
  };

  useEffect(() => {
    const setHighlightsFromFile = async () => {
      if (!highlightUrl || !pdfUploaded) {
        return;
      }
      const res = await fetch(highlightUrl);
      if (res.ok) {
        const data = await res.json();
        const highlights = data.map((highlight: StoredHighlight) =>
          StoredHighlightToIHighlight(highlight)
        );
        setHighlights(highlights);
        const body =
          storageMethod === StorageMethod.sqlite
            ? {
                pdfId,
                highlights: data,
              }
            : data;
        await fetch("/api/highlight/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    };
    setHighlightsFromFile();
  }, [highlightUrl, pdfUploaded, pdfId]);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const handleSearch = async () => {
    if (pdfUrl && searchTerm) {
      const keywords = searchTerm.split("|");
      let currentZoom = 1;

      if (pdfViewerRef.current) {
        if ("scale" in pdfViewerRef.current) {
          currentZoom = pdfViewerRef.current.scale;
        } else if (
          pdfViewerRef.current.viewer &&
          "scale" in pdfViewerRef.current.viewer
        ) {
          currentZoom = pdfViewerRef.current.viewer.scale;
        } else {
          console.warn(
            "Unable to determine current zoom level. Using default zoom of 1."
          );
        }
      }

      console.log("Current zoom level:", currentZoom);

      let newHighlights = await searchPdf(keywords, pdfUrl, currentZoom);
      if (newHighlights.length === 0 && pdfOcrUrl) {
        // Try searching the OCR pdf
        // This step is sometimes required due to the OCR process
        //   possibly being lossy (pdf -> png -> pdf)
        //   which means some words are missing/malformed
        newHighlights = await searchPdf(keywords, pdfOcrUrl, currentZoom);
      }

      console.log("newHighlights:", JSON.stringify(newHighlights, null, 2));

      const updatedHighlights = [...highlights, ...newHighlights];

      if (pdfName && pdfId) {
        const storedHighlights = updatedHighlights.map((highlight) =>
          IHighlightToStoredHighlight(highlight, pdfId)
        );
        const body =
          storageMethod === StorageMethod.sqlite
            ? {
                pdfId,
                highlights: storedHighlights,
              }
            : storedHighlights;
        await fetch("/api/highlight/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setHighlights(updatedHighlights);
    }
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

  const scrollToHighlightFromHash = useCallback(() => {
    const highlightId = parseIdFromHash();
    const highlight = highlights.find((h) => h.id === highlightId);
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  }, [highlights]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false
      );
    };
  }, [scrollToHighlightFromHash]);

  useEffect(() => {
    const fetchPdfFile = async () => {
      setLoading(true);
      setPdfUrl(null);
      setPdfName(null);
      setPdfId(null);
      try {
        const response = await fetch("/api/fetch");
        const blobData = await response.blob();

        const filenames = response.headers.get('X-Filenames');
        const startPages = response.headers.get('X-Start-Pages');
        console.log(filenames);
        console.log(startPages);
        
        const newPdfFile = URL.createObjectURL(blobData);
        setPdfUrl(newPdfFile);
        setPdfName("Highlights");
        setPdfId("test");
        return () => {
          URL.revokeObjectURL(newPdfFile);
        };
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfFile();
  }, [refreshData]);

  const handleDeletePdfs = async () => {
    const response = await fetch("/api/delete", {
      method: "DELETE",
    });
    setRefreshData(prev => !prev);
  };

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
              pdfUploaded={pdfUploaded}
            />
            <DeleteAll
              onDeletePdfs={handleDeletePdfs}
            />
            {
              /* session.status === "authenticated" &&  */ pdfId && (
                <HighlightUploader
                  onFileUpload={handleHighlightUpload}
                  highlights={highlights}
                  pdfId={pdfId}
                />
              )
            }
            {pdfUrl && (
              <KeywordSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleSearch={handleSearch}
                resetHighlights={resetHighlights}
              />
            )}
          </div>
          {loading ? (
            <div className="w-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div>
              {pdfUrl ? (
                <PdfViewer
                  pdfUrl={pdfUrl}
                  pdfName={pdfName}
                  pdfId={pdfId}
                  highlights={highlights}
                  setHighlights={setHighlights}
                  highlightsKey={highlightsKey}
                  pdfViewerRef={pdfViewerRef}
                  resetHash={resetHash}
                  scrollViewerTo={scrollViewerTo}
                  scrollToHighlightFromHash={scrollToHighlightFromHash}
                />
              ) : (
                <div className="text-center text-gray-500">No PDFs</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
