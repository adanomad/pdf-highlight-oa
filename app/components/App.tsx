// app/components/App.tsx
"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfUploader from "./PdfUploader";
import KeywordSearch from "./KeywordSearch";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
import { convertPdfToImages, searchPdf, searchImages, extractImagesFromPdf, getPageTexts } from "../utils/pdfUtils";
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
import DocuSidebar from "./DocuSideBar";
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
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [searchMode, setSearchMode] = useState<"word" | "image">("word");

  // const session = useSession();

  const loadDocuments = async () => {
  const res = await fetch("/api/files/list", { cache: "no-store" });
  const docs = await res.json();
    setDocuments(docs);
  };
  useEffect(() => { loadDocuments(); }, []);

  const onSelectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    setPdfUrl(doc.url);
    setPdfName(doc.name);
    setPdfId(id);
  };

  const onDeleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const r = await fetch("/api/files/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: id }),
    });
    if (r.ok) await loadDocuments();
  };

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);

    // 1) upload to Supabase via API
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/files/upload", { method: "POST", body: fd });
    const { fileUrl } = await up.json();

    // 2) OCR first page (optional fallback)
    const imgs = await convertPdfToImages(file);
    const worker = await createWorker("eng");
    const res = await worker.recognize(imgs[0], { pdfTitle: "ocr-out" }, { pdf: true });
    const pdfData = res.data.pdf;
    if (pdfData) {
      const blob = new Blob([new Uint8Array(pdfData)], { type: "application/pdf" });
      const ocrUrl = URL.createObjectURL(blob);
      setPdfOcrUrl(ocrUrl);
    }

    // 3) set viewer state
    setPdfUrl(fileUrl);
    setPdfUploaded(true);
    setPdfName(file.name);
    setPdfId(file.name);

    try {
      // 4) Build per-page text + images on the client
      const extracted = await extractImagesFromPdf(fileUrl);
      const imagesByPage: Record<number, string[]> = {};
      for (const im of extracted) {
        (imagesByPage[im.pageNumber] ??= []).push(im.image);
      }

      const pageTexts = await getPageTexts(fileUrl);

      // 5) Send to the server indexer
      const ix = await fetch("/api/index/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url: fileUrl,
          pages: pageTexts.map((p) => ({
            pageNumber: p.pageNumber,
            text: p.text,
            images: imagesByPage[p.pageNumber] ?? [],
          })),
        }),
      });

      if (!ix.ok) {
        const err = await ix.text().catch(() => "");
        console.error("Indexing failed:", ix.status, err);
      } else {
        const j = await ix.json().catch(() => ({}));
        console.log("Indexing ok:", j);
      }
    } catch (e) {
      console.warn("Indexing step failed:", e);
    } finally {
      // 6) refresh doc list & stop spinner
      setTimeout(loadDocuments, 500);
      setLoading(false);
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

  const onJumpToResult = (docId: string, url: string, pageNumber: number) => {
    const switchDoc = docId !== pdfId;
    if (switchDoc) {
      // Load the new PDF first, then jump
      setPdfUrl(url);
      setPdfName(documents.find((d) => d.id === docId)?.name ?? null);
      setPdfId(docId);
      // Give the viewer a tick to mount, then jump
      setTimeout(() => goToPage(pageNumber), 250);
    } else {
      goToPage(pageNumber);
    }
  };


  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    // 1) Global search (all docs) — fills sidebar results
    const kind = searchMode === "image" ? "image" : "text";
    const r = await fetch(
      `/api/search?q=${encodeURIComponent(searchTerm)}&kind=${kind}&limit=20`,
      { cache: "no-store" }
    );
    const raw = r.ok ? await r.json() : [];

    // Normalize every row shape we might get back and enrich from `documents`
    const mapped = (Array.isArray(raw) ? raw : []).map((row: any) => {
      const document_id =
        row.document_id ?? row.doc_id ?? row.pdf_id ?? row.file_id ?? row.id ?? "";
      const page_number =
        typeof row.page_number === "number"
          ? row.page_number
          : typeof row.page === "number"
          ? row.page
          : 1;
      const kind2 = (row.kind as "text" | "image") ?? (kind as "text" | "image");
      const distance =
        typeof row.distance === "number"
          ? row.distance
          : typeof row.score === "number"
          ? row.score
          : typeof row.similarity === "number"
          ? row.similarity
          : 0;

      const doc = documents.find((d) => d.id === document_id);
      return {
        document_id,
        document_name: doc?.name ?? document_id,
        url: doc?.url ?? "",
        page_number,
        kind: kind2,
        distance,
      };
    });

    // 2) In-document highlights (only if a PDF is open)
    if (!pdfUrl) return;

    const currentZoom = pdfViewerRef.current?.viewer?.getCurrentScale?.() ?? 1;
    const keywords = searchTerm.split(/\s+/).filter(Boolean);

    let newHighlights: IHighlight[] = [];

    if (searchMode === "word") {
      newHighlights = await searchPdf(keywords, pdfUrl, currentZoom);
      if (newHighlights.length === 0 && pdfOcrUrl) {
        newHighlights = await searchPdf(keywords, pdfOcrUrl, currentZoom);
      }
    } else {
      newHighlights = await searchImages(keywords, pdfUrl, currentZoom);
    }

    setHighlights(newHighlights);
    setHighlightsKey((k) => k + 1);
  };


  const goToPage = (pageNumber: number) => {
    const viewer = pdfViewerRef.current?.viewer;
    if (viewer?.scrollPageIntoView) {
      try {
        viewer.scrollPageIntoView({ pageNumber });
        return;
      } catch {}
    }
    // Fallback if the viewer doesn’t expose scrollPageIntoView:
    window.location.hash = `#page=${pageNumber}`;
  };


  const parseIdFromHash = () => {
    return document.location.hash.slice("#highlight-".length);
  };

  const resetHash = () => {
    document.location.hash = "";
  };

  const scrollViewerTo = useRef<(h: IHighlight) => void>(() => {});

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
    <div className="flex min-h-screen bg-[linear-gradient(120deg,_rgb(249_250_251)_50%,_rgb(239_246_255)_50%)] text-black">
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
                term={searchTerm}
                setTerm={setSearchTerm}
                onSearch={handleSearch}
                onClear={resetHighlights}
                mode={searchMode}
                setMode={setSearchMode}
              />
            )}
          </div>
          {loading ? (
            <div className="w-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <PdfViewer
              key={pdfUrl || 'no-pdf'}
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
      {/* Floating Sidebar for showing the documents */}
      <div className="right-0 top-0 h-screen w-80 bg-white border-l border-gray-300 shadow-lg overflow-y-auto">
        <DocuSidebar
          documents={documents}
          selectedId={pdfId}
          onSelect={onSelectDocument}
          onDelete={onDeleteDocument}
          onJumpToResult={onJumpToResult}
        />
      </div>
    </div>
  );
}
