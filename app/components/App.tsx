// app/components/App.tsx
"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfUploader from "./PdfUploader";
import KeywordSearch from "./KeywordSearch";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
import HighlightUploader from "./HighlightUploader";
import Extractor from "./Extractor";
import ChatWithWtfPDF from "./ChatWithPDF";

import { convertPdfToImages, searchPdf, getPdfId } from "../utils/pdfUtils";
import type { IHighlight } from "react-pdf-highlighter";
import { StoredHighlight, StorageMethod } from "../utils/types";
import {
  IHighlightToStoredHighlight,
  StoredHighlightToIHighlight,
} from "../utils/utils";
import { createWorker } from "tesseract.js";
import { storageMethod } from "../utils/env";
// import { useSession } from "next-auth/react";

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedMessage, setExtractedMessage] = useState<string>("");

  const pdfViewerRef = useRef<any>(null);
  // const session = useSession();

  // Increment key whenever highlights change to force re-render of PdfHighlighter
  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  // 1. Handle File Upload (including OCR creation)
  const handleFileUpload = async (file: File) => {
    setLoading(true);

    // Keep the original file for Extractor usage
    setUploadedFile(file);

    // Create URL for the original PDF
    const fileUrl = URL.createObjectURL(file);
    const generatedPdfId = getPdfId(
      file.name,
      /* session.data?.user?.email ?? */ undefined
    );

    // Convert PDF to images and run Tesseract OCR on the first page
    const images = await convertPdfToImages(file);
    const worker = await createWorker("eng");
    const res = await worker.recognize(images[0], { pdfTitle: "ocr-out" }, { pdf: true });

    // If OCR was successful, create a Blob and update pdfOcrUrl
    const pdfBuffer = res.data.pdf;
    if (pdfBuffer) {
      const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
      const fileOcrUrl = URL.createObjectURL(blob);
      setPdfOcrUrl(fileOcrUrl);
    }

    setPdfUrl(fileUrl);
    setPdfName(file.name);
    setPdfId(generatedPdfId);
    setPdfUploaded(true);
    setLoading(false);
  };

  // 2. Fetch existing highlights from the backend if any
  useEffect(() => {
    const getHighlights = async () => {
      if (!pdfName || !pdfId) return;
      const res = await fetch("/api/highlight/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfId),
      });

      if (res.ok) {
        const resHighlights = await res.json();
        console.log("getHighlights", pdfId, resHighlights);
        if (resHighlights) {
          const mapped = resHighlights.map((stored: StoredHighlight) =>
            StoredHighlightToIHighlight(stored)
          );
          setHighlights(mapped);
        }
      }
    };
    getHighlights();
  }, [pdfName, pdfId]);

  // 3. Handle highlight JSON uploads
  const handleHighlightUpload = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setHighlightUrl(fileUrl);
  };

  // 4. Load highlights from JSON file; optionally sync to backend
  useEffect(() => {
    const setHighlightsFromFile = async () => {
      if (!highlightUrl || !pdfUploaded) return;

      const res = await fetch(highlightUrl);
      if (res.ok) {
        const data = await res.json();
        const mappedHighlights = data.map((h: StoredHighlight) =>
          StoredHighlightToIHighlight(h)
        );
        setHighlights(mappedHighlights);

        const body =
          storageMethod === StorageMethod.sqlite
            ? { pdfId, highlights: data }
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

  // 5. Searching PDF with OCR fallback
  const handleSearch = async () => {
    if (!pdfUrl || !searchTerm) return;

    const keywords = searchTerm.split("|");

    // Attempt to find current zoom level
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
        console.warn("Unable to determine current zoom; defaulting to 1.");
      }
    }

    // Search original PDF
    let newHighlights = await searchPdf(keywords, pdfUrl, currentZoom);

    // If no results, fallback to OCR PDF
    if (newHighlights.length === 0 && pdfOcrUrl) {
      newHighlights = await searchPdf(keywords, pdfOcrUrl, currentZoom);
    }

    const updatedHighlights = [...highlights, ...newHighlights];

    if (pdfName && pdfId) {
      const storedHighlights = updatedHighlights.map((hl) =>
        IHighlightToStoredHighlight(hl, pdfId)
      );
      const body =
        storageMethod === StorageMethod.sqlite
          ? { pdfId, highlights: storedHighlights }
          : storedHighlights;

      await fetch("/api/highlight/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setHighlights(updatedHighlights);
  };

  // 6. Hash-based navigation to a specific highlight
  const parseIdFromHash = () => document.location.hash.slice("#highlight-".length);
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
      window.removeEventListener("hashchange", scrollToHighlightFromHash, false);
    };
  }, [scrollToHighlightFromHash]);

  // 7. Handler for extracted text from the PDF (via Extractor component)
  const handleExtracted = (message: string) => {
    setExtractedMessage(message);
    console.log("Extracted message received in App:", message);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white/70">
      {/* Header at the top */}
      <div className="sticky top-0 z-10">
        <Header />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDE: PDF Tools, Uploader, Viewer */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Uploader */}
            <PdfUploader onFileUpload={handleFileUpload} pdfUploaded={pdfUploaded} />

            {/* Highlight Uploader (only if PDF ID is set) */}
            {pdfId && (
              <HighlightUploader
                onFileUpload={handleHighlightUpload}
                highlights={highlights}
                pdfId={pdfId}
              />
            )}

            {/* Keyword Search (only if PDF is ready) */}
            {pdfUrl && (
              <KeywordSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleSearch={handleSearch}
                resetHighlights={resetHighlights}
              />
            )}

            {/* PDF Viewer or Spinner */}
            {loading ? (
              <div className="w-full flex items-center justify-center">
                <Spinner />
              </div>
            ) : (
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
            )}
          </div>
        </div>

        
        <div className="w-[400px] p-4 space-y-4 bg-white/70 overflow-y-auto">
          {/* Extractor only if a file is uploaded */}
          {uploadedFile && (
            <Extractor file={uploadedFile} onExtracted={handleExtracted} />
          )}

          {/* Chat receives the extracted text as context */}
          <ChatWithWtfPDF extractedMessage={extractedMessage} />
        </div>
      </div>
    </div>
  );
}
