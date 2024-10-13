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
  const pdfViewerRef = useRef<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null); // Store the uploaded PDF file
  const [searchResults, setSearchResults] = useState<Array<{ imageIndex: number; similarity: number }>>([]);
  
  // const session = useSession();

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    let fileUrl = URL.createObjectURL(file);

    setPdfFile(file); // Store the file object
    const pdfId = getPdfId(
      file.name,
      /* session.data?.user?.email ?? */ undefined
    );
    // Creating a searchable PDF:
    // Convert uploaded PDF file to b64 image,
    //   perform OCR,
    //   convert output back to PDF
    //   update file url with new PDF url
    const i = await convertPdfToImages(file);
    const worker = await createWorker("eng");
    const res = await worker.recognize(
      i[0],
      { pdfTitle: "ocr-out" },
      { pdf: true }
    );
    const pdf = res.data.pdf;
    if (pdf) {
      // Update file url if OCR success
      const blob = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
      const fileOcrUrl = URL.createObjectURL(blob);
      setPdfOcrUrl(fileOcrUrl);

      // Index words
      // const data = res.data.words;
      // const words = data.map(({ text, bbox: { x0, y0, x1, y1 } }) => {
      //   return {
      //     keyword: text,
      //     x1: x0,
      //     y1: y0,
      //     x2: x1,
      //     y2: y1,
      //   };
      // });
      // await fetch("/api/index", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     pdfId,
      //     words,
      //   }),
      // });
    }
    setPdfUrl(fileUrl);
    setPdfUploaded(true);
    setPdfName(file.name);
    setPdfId(pdfId);
    setLoading(false);
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
    if (pdfFile && searchTerm) {
      setLoading(true);

      // Prepare the form data
      const formData = new FormData();
      formData.append('searchTerm', searchTerm);
      formData.append('pdfFile', pdfFile);

      try {
        // Send the request to your API route
        const response = await fetch('/api/image-search/update', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Search Results:', data.results);

          // Update the state with the search results
          setSearchResults(data.results);
        } else {
          const errorData = await response.json();
          console.error('Error:', errorData);
          alert('Image search failed.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please upload a PDF file and enter a search term.');
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
            {/* Existing components */}
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

              {/* Display the search results */}
              {searchResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold">Image Search Results:</h3>
                  <ul className="list-disc pl-5">
                    {searchResults.map((result, index) => (
                      <li key={index}>
                        Image {result.imageIndex} - Similarity: {result.similarity.toFixed(4)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}