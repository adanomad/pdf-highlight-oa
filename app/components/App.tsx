// app/components/App.tsx
"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfUploader from "./PdfUploader";
import KeywordSearch from "./KeywordSearch";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
<<<<<<< HEAD
import { convertPdfToImages, searchPdf, searchImages } from "../utils/pdfUtils";
=======
import { convertPdfToImages, searchPdf } from "../utils/pdfUtils";
>>>>>>> upstream/main
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
<<<<<<< HEAD

import DocumentSidebar from "./DocumentSidebar";
import { extractImagesFromPdf } from "../utils/pdfUtils";
=======
>>>>>>> upstream/main

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
  // const session = useSession();

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

<<<<<<< HEAD
  // NEW (sets the document list triggers when documents are updated)
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [images, setImages] = useState<Array<any>>([]);
  const [searchMode, setSearchMode] = useState<"word" | "image">("word");

  const fetchDocuments = async () => {
    const response = await fetch("/api/docs", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });    
    const docs = await response.json();
    setDocuments(docs);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // handles selection of document by its ID and updates state variables
  const handleDocumentSelect = (id: string) => {
    const selectedDoc = documents.find((doc) => doc.id === id);
    if (selectedDoc) {
      setPdfUrl(selectedDoc.url);
      setPdfName(selectedDoc.name);
      setPdfId(id);
    }
  };

  const handleDeleteDocument = async (fileName : string) => {
    const confirmed = window.confirm('Are you sure you want to delete this document?');
    if (!confirmed) return;

    const response = await fetch(`/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName }),
    });

    if (response.ok) {
      console.log('Document deleted successfully');
      await fetchDocuments();
    } 
  }

  const handleFileUpload = async (file: File) => {
    setLoading(true);
  
    // Use a FormData object to send the file to the server
    const formData = new FormData();
    formData.append("file", file);
  
    // Upload file to the server
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  
    const { fileUrl } = await response.json(); // File URL from server (Supabase)
  
    const pdfId = getPdfId(
      file.name,
      /* session.data?.user?.email ?? */ undefined
    );
  
    // OCR Processing: Convert uploaded PDF file to b64 image, perform OCR, and return PDF
    const i = await convertPdfToImages(file); // Convert the file to images for OCR
    const worker = await createWorker("eng");
    const res = await worker.recognize(i[0], { pdfTitle: "ocr-out" }, { pdf: true });
    
    const pdf = res.data.pdf;
    if (pdf) {
      // If OCR success, create a new Blob and URL for the processed OCR PDF
      const blob = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
      const fileOcrUrl = URL.createObjectURL(blob);
      setPdfOcrUrl(fileOcrUrl); // Set the new OCR PDF URL for viewing
    }
  
    // Set the original uploaded PDF URL for viewing
    setPdfUrl(fileUrl); 
    setPdfUploaded(true);
    setPdfName(file.name);
    setPdfId(pdfId);
  
    // Extract images from the uploaded PDF using the URL from the server
    if (fileUrl) {
      const extractedImages = await extractImagesFromPdf(fileUrl);
      setImages(extractedImages);
    }
  
    // Timeout for fetching the updated list of documents
    setTimeout(async () => {
      await fetchDocuments();
    }, 500); // 0.5 second delay to allow Supabase to process the upload
    
    setLoading(false); // Stop loading
  };
  

  useEffect(() => {
=======
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    let fileUrl = URL.createObjectURL(file);
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
>>>>>>> upstream/main
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

      let newHighlights: IHighlight[] = [];

      if (searchMode === "word") {
        newHighlights = await searchPdf(keywords, pdfUrl, currentZoom);

        // Try searching in the OCR PDF if no results found
        if (newHighlights.length === 0 && pdfOcrUrl) {
          newHighlights = await searchPdf(keywords, pdfOcrUrl, currentZoom);
        }

      } else if (searchMode === "image") {
        newHighlights = await searchImages(keywords, pdfUrl, currentZoom);
      }

<<<<<<< HEAD
=======
      let newHighlights = await searchPdf(keywords, pdfUrl, currentZoom);
      if (newHighlights.length === 0 && pdfOcrUrl) {
        // Try searching the OCR pdf
        // This step is sometimes required due to the OCR process
        //   possibly being lossy (pdf -> png -> pdf)
        //   which means some words are missing/malformed
        newHighlights = await searchPdf(keywords, pdfOcrUrl, currentZoom);
      }

>>>>>>> upstream/main
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
<<<<<<< HEAD

=======
>>>>>>> upstream/main
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

  return (
<<<<<<< HEAD
    <div className="relative min-h-screen bg-[linear-gradient(120deg,_rgb(249_250_251)_50%,_rgb(239_246_255)_50%)] text-black">
    {/* Main Content Area */}
    <div className="flex-1 pr-64"> {/* Add padding-right to avoid content overlap */}
      <div className="mb-8 sticky top-0">
        <Header />
      </div>
  
      <div className="max-w-4xl mx-auto space-y-6 mb-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* PDF Uploader Component */}
          <PdfUploader onFileUpload={handleFileUpload} pdfUploaded={pdfUploaded} />
  
          {/* Conditionally show the highlight uploader if a PDF is selected */}
          {pdfId && (
            <HighlightUploader onFileUpload={handleHighlightUpload} highlights={highlights} pdfId={pdfId} />
          )}
        </div>

        {/* Conditionally show the Keyword Search Component if a PDF URL is set */}
        {pdfUrl && (
          <div className="w-full"> {/* Adjust width to make KeywordSearch longer */}
            <KeywordSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
              resetHighlights={resetHighlights}
              mode={searchMode}
              setMode={setSearchMode}
            />
          </div>
          )}
  
        {loading ? (
          <div className="w-full flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          // Main PDF Viewer in the center
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
=======
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
>>>>>>> upstream/main
      </div>
    </div>
  
    {/* Floating Sidebar for showing the documents */}
    <div className="absolute right-0 top-0 h-screen w-80 bg-white border-l border-gray-300 shadow-lg overflow-y-auto">
      <DocumentSidebar
        documents={documents}
        onDocumentSelect={handleDocumentSelect}
        selectedDocumentId={pdfId}
        onDeleteDocument={handleDeleteDocument}
      />
    </div>
  </div>
  
  );
}
