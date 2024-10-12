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
import { getPdfId } from "../utils/pdfUtils";
import { storageMethod } from "../utils/env";

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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false); // Separate loading for Image Search
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]); // Store image search results
  const pdfViewerRef = useRef<any>(null);

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  // Handle PDF Upload
  const handleFileUpload = async (file: File) => {
    console.log("File received for upload:", file); // Check if file is being received

    setPdfLoading(true); // Start loading when PDF is being uploaded
    let fileUrl = URL.createObjectURL(file);
    console.log("Generated file URL:", fileUrl); // Log to see the generated URL

    const pdfId = getPdfId(file.name);

    try {
      const i = await convertPdfToImages(file);
      console.log("Converted PDF to images:", i); // Log conversion result

      const worker = await createWorker("eng");
      const res = await worker.recognize(i[0], { pdfTitle: "ocr-out" }, { pdf: true });
      const pdf = res.data.pdf;

      if (pdf) {
        const blob = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
        const fileOcrUrl = URL.createObjectURL(blob);
        setPdfOcrUrl(fileOcrUrl);
        console.log("Generated OCR URL:", fileOcrUrl); // Log the OCR URL
      }
    } catch (error) {
      console.error("Error during PDF processing:", error); // Log any error
    }

    setPdfUrl(fileUrl); // Set the generated URL
    console.log("Set pdfUrl:", fileUrl); // Confirm the pdfUrl is being set
    setPdfUploaded(true);
    setPdfName(file.name);
    setPdfId(pdfId);
    setPdfLoading(false); // Stop loading when PDF upload is done
  };

  // Fetch Highlights for the PDF
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

  // Handle Image Search Request
  const handleImageSearch = async () => {
    if (!pdfUrl) {
      alert("Please upload a PDF before searching for images.");
      return;
    }

    const formData = new FormData();
    const pdfFile = await fetch(pdfUrl).then((res) => res.blob()); // Convert URL to a Blob (PDF file)
    formData.append("pdf", pdfFile);
    formData.append("searchTerm", searchTerm);

    setImageSearchLoading(true); // Start loading for Image Search

    try {
      const response = await fetch("/api/image-search/update", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageSearchResults(data); // Store the image search results
        console.log("Image search results:", data); // Log the results to verify
      } else {
        console.error("Image search failed.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setImageSearchLoading(false); // Stop image search loading
    }
  };

  // Handle Keyword Search Request
  const handleSearch = async () => {
    if (pdfUrl && searchTerm) {
      let currentZoom = 1;

      // Text Search Logic
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

      let newHighlights = await searchPdf([searchTerm], pdfUrl, currentZoom);
      if (newHighlights.length === 0 && pdfOcrUrl) {
        newHighlights = await searchPdf([searchTerm], pdfOcrUrl, currentZoom);
      }

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

  const resetHighlights = () => {
    setHighlights([]);
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

  return (
    <div className="flex min-h-screen bg-[linear-gradient(120deg,_rgb(249_250_251)_50%,_rgb(239_246_255)_50%)]">
      <div className="flex-1">
        <div className="mb-8 sticky top-0">
          <Header />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 mb-8">
          <div className="max-w-xl mx-auto space-y-6">
            <PdfUploader onFileUpload={handleFileUpload} pdfUploaded={pdfUploaded} />
            {pdfUploaded && (
              <div>
                <p>PDF Uploaded Successfully. URL: {pdfUrl}</p> {/* Log URL */}
              </div>
            )}

            {pdfId && (
              <HighlightUploader
                onFileUpload={handleHighlightUpload}
                highlights={highlights}
                pdfId={pdfId}
              />
            )}

            {pdfUrl && (
              <>
                <KeywordSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleSearch={handleSearch}
                  resetHighlights={resetHighlights}
                />
                <button onClick={handleImageSearch} style={{ color: "black" }}>
                  Search for Images
                </button>
                {/* Loading for Image Search */}
                {imageSearchLoading && (
                  <div className="w-full flex items-center justify-center">
                    <Spinner />
                  </div>
                )}
                {/* Display Image Search Results */}
                <div>
                  {imageSearchResults.length > 0 ? (
                    <>
                      <h3>Image Search Results:</h3>
                      {imageSearchResults.map((result, index) => (
                        <p key={index}>Image {result.imageIndex}: Similarity: {result.similarity}</p>
                      ))}
                    </>
                  ) : (
                    <p>No image search results yet.</p>
                  )}
                </div>
              </>
            )}
          </div>

          {pdfUrl ? (
            <>
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
            </>
          ) : (
            <p>No PDF to display</p>
          )}

          {pdfLoading && (
            <div className="w-full flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
