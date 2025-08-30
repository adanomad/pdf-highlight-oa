// app/components/App.tsx
"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfUploader from "./PdfUploader";
import KeywordSearch from "./KeywordSearch";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
import {
  convertPdfToImages,
  searchPdf,
  extractPagesText,
} from "../utils/pdfUtils";
import type { IHighlight } from "react-pdf-highlighter";
import HighlightUploader from "./HighlightUploader";
import { StoredHighlight, StorageMethod } from "../utils/types";
import {
  IHighlightToStoredHighlight,
  StoredHighlightToIHighlight,
} from "../utils/utils";
import { createWorker } from "tesseract.js";
import { getPdfId } from "../utils/pdfUtils";
import { storageMethod, supabaseUrl, supabaseKey } from "../utils/env";
import { createClient } from "@supabase/supabase-js";

type DocState = {
  pdfId: string;
  name: string;
  fileUrl: string | null;
  ocrUrl: string | null;
  highlights: IHighlight[];
};

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

  const [docs, setDocs] = useState<Record<string, DocState>>({});
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [showDocsMenu, setShowDocsMenu] = useState(false);

  const [searchMode, setSearchMode] = useState(false);
  const [preSearchState, setPreSearchState] = useState<{
    pdfId: string | null;
    pdfName: string | null;
    pdfUrl: string | null;
    pdfOcrUrl: string | null;
    highlights: IHighlight[];
  } | null>(null);

  const [highlightOwner, setHighlightOwner] = useState<Record<string, string>>(
    {}
  );
  const [pendingScrollTo, setPendingScrollTo] = useState<IHighlight | null>(
    null
  );

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  useEffect(() => {
    if (!pdfId) return;
    setDocs((d) => {
      const cur = d[pdfId];
      if (!cur) return d;
      if (
        cur.highlights === highlights &&
        cur.fileUrl === pdfUrl &&
        cur.ocrUrl === pdfOcrUrl &&
        cur.name === pdfName
      )
        return d;
      return {
        ...d,
        [pdfId]: {
          ...cur,
          name: pdfName ?? cur.name,
          fileUrl: pdfUrl,
          ocrUrl: pdfOcrUrl,
          highlights: searchMode ? cur.highlights : highlights,
        },
      };
    });
  }, [pdfId, pdfUrl, pdfOcrUrl, pdfName, highlights, searchMode]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      // Local preview
      const fileUrl = URL.createObjectURL(file);
      const newPdfId = getPdfId(file.name, undefined);

      // Optional: upload PDF to Supabase Storage if using "supabase"
      if (storageMethod === ("supabase" as StorageMethod) && supabaseUrl && supabaseKey) {
        try {
          const supa = createClient(supabaseUrl, supabaseKey);
          const path = `uploads/${newPdfId}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supa.storage
            .from("pdfs")
            .upload(path, file, {
              contentType: file.type || "application/pdf",
              upsert: true,
            });
          if (upErr) {
            console.warn("Supabase upload failed:", upErr.message);
          } else {
            const { data } = supa.storage.from("pdfs").getPublicUrl(path);
            console.log("Supabase upload OK:", { path, publicUrl: data?.publicUrl });
            // if you want to switch viewer to CDN link, uncomment:
            // if (data?.publicUrl) setPdfUrl(data.publicUrl);
          }
        } catch (e) {
          console.warn("Supabase upload error:", e);
        }
      }

      // ---- Prefer text layer first
      let pageTexts: Array<{ page: number; text: string }> = [];
      try {
        pageTexts = await extractPagesText(fileUrl);
      } catch (e) {
        pageTexts = [];
        console.warn("extractPagesText failed; will OCR all pages.", e);
      }

      const needsTextExtraction = pageTexts.length === 0;
      const imageOnlyPages = needsTextExtraction
        ? []
        : pageTexts
            .filter((p) => (p.text ?? "").trim().length < 2)
            .map((p) => p.page);

      const page1HasText =
        !needsTextExtraction &&
        !!pageTexts.find((p) => p.page === 1 && (p.text ?? "").trim().length >= 2);

      // ---- Page-1 OCR fallback PDF (only if page 1 has NO text)
      let newOcrUrl: string | null = null;

      // lazy Tesseract worker
      let worker: any | null = null;
      const getWorker = async () => {
        if (!worker) worker = await createWorker("eng");
        return worker;
      };

      if (!page1HasText) {
        try {
          const imgs = await convertPdfToImages(file);
          if (imgs[0]) {
            const w = await getWorker();
            const res = await w.recognize(
              imgs[0],
              { pdfTitle: "ocr-out" },
              { pdf: true }
            );
            const ocrPdf = res.data.pdf;
            if (ocrPdf) {
              const blob = new Blob([new Uint8Array(ocrPdf)], {
                type: "application/pdf",
              });
              newOcrUrl = URL.createObjectURL(blob);
            }
          }
        } catch (e) {
          console.warn("Page-1 OCR fallback failed:", e);
        }
      }

      // Create doc record in memory
      setDocs((d) => ({
        ...d,
        [newPdfId]: {
          pdfId: newPdfId,
          name: file.name,
          fileUrl,
          ocrUrl: newOcrUrl,
          highlights: [],
        },
      }));

      if (!currentPdfId) {
        setCurrentPdfId(newPdfId);
        setPdfUrl(fileUrl);
        setPdfOcrUrl(newOcrUrl);
        setPdfUploaded(true);
        setPdfName(file.name);
        setPdfId(newPdfId);
      }

      // ---- Background: build semantic index
      (async () => {
        try {
          let pagesOut: Array<{ page: number; text: string }> = [];

          if (needsTextExtraction) {
            const imgs = await convertPdfToImages(file);
            const w = await getWorker();
            for (let p = 0; p < imgs.length; p++) {
              const r = await w.recognize(imgs[p]);
              pagesOut.push({ page: p + 1, text: r.data.text || "" });
            }
          } else if (imageOnlyPages.length === 0) {
            pagesOut = pageTexts;
          } else {
            pagesOut = [...pageTexts];
            const imgs = await convertPdfToImages(file);
            const w = await getWorker();
            for (const pageNum of imageOnlyPages) {
              const idx = pageNum - 1;
              if (imgs[idx]) {
                const r = await w.recognize(imgs[idx]);
                const ocrText = r.data.text || "";
                pagesOut[idx] = { page: pageNum, text: ocrText };
              }
            }
          }

          if (worker?.terminate) {
            try {
              await worker.terminate();
            } catch {}
          }

          await fetch("/api/semantic/index", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfId: newPdfId, pages: pagesOut }),
          });
        } catch (e) {
          console.error("Semantic indexing failed:", e);
        }
      })();
    } finally {
      setLoading(false);
    }
  };

  // Load highlights (by pdfId) from server (Supabase table)
  useEffect(() => {
    const getHighlights = async () => {
      if (!pdfName || !pdfId) return;
      try {
        const res = await fetch("/api/highlight/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfId }),
        });
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr)) {
            const loaded = arr.map((stored: StoredHighlight) =>
              StoredHighlightToIHighlight(stored)
            );
            if (!searchMode) setHighlights(loaded);
          }
        }
      } catch (e) {
        console.warn("getHighlights failed:", e);
      }
    };
    getHighlights();
  }, [pdfName, pdfId, searchMode]);

  // Import highlights from file (still supported)
  const handleHighlightUpload = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setHighlightUrl(fileUrl);
  };

  useEffect(() => {
    const setHighlightsFromFile = async () => {
      if (!highlightUrl || !pdfUploaded) return;
      const res = await fetch(highlightUrl);
      if (res.ok) {
        const data: StoredHighlight[] = await res.json();
        const highlightsFromFile = data.map((h: StoredHighlight) =>
          StoredHighlightToIHighlight(h)
        );
        if (!searchMode) setHighlights(highlightsFromFile);

        // Replace-all on server (Supabase table)
        try {
          await fetch("/api/highlight/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfId, highlights: data }),
          });
        } catch {}
      }
    };
    setHighlightsFromFile();
  }, [highlightUrl, pdfUploaded, pdfId, searchMode]);

  // ---- Autosave: whenever highlights change, push to server (replace-all per pdf)
  useEffect(() => {
    if (!pdfId || searchMode) return;
    const t = setTimeout(async () => {
      try {
        const stored = highlights.map((h) => {
          const s = IHighlightToStoredHighlight(h);
          return { ...s, pdfId }; // ensure pdfId present
        });
        await fetch("/api/highlight/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfId, highlights: stored }),
        });
      } catch (e) {
        console.warn("Autosave highlights failed:", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [highlights, pdfId, searchMode]);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const switchDoc = (id: string) => {
    const doc = docs[id];
    if (!doc) return;
    setCurrentPdfId(id);
    setPdfUrl(doc.fileUrl);
    setPdfOcrUrl(doc.ocrUrl);
    setPdfUploaded(true);
    setPdfName(doc.name);
    setPdfId(doc.pdfId);
    if (!searchMode) setHighlights(doc.highlights);
  };

  // ---- Semantic query helper (search only the PDFs you've uploaded) ----
  async function semanticSearchAllDocs(
    query: string,
    docList: DocState[],
    topK = 20
  ) {
    const pdfIds = docList.map((d) => d.pdfId);
    const r = await fetch("/api/semantic/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK, pdfIds }),
    });
    if (!r.ok) return [];
    return (await r.json()) as Array<{
      pdfId: string;
      page: number;
      text: string;
      score: number;
    }>;
  }

  function pickProbeWords(text: string, limit = 6): string[] {
    const tokens = (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of tokens) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
        if (out.length >= limit) break;
      }
    }
    return out.length ? out : (text || "").split(/\s+/).slice(0, 3);
  }

  function scoreOverlap(textA: string, textB: string) {
    const toks = (s: string) =>
      (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

    const a = toks(textA);
    const b = toks(textB);
    if (!a.length || !b.length) return 0;
    const setA = new Set(a);
    const setB = new Set(b);
    let inter = 0;
    for (const t of setA) if (setB.has(t)) inter++;
    return inter / (setA.size + setB.size - inter + 1e-9);
  }

  function chooseBestLocalizedHighlight(
    localized: IHighlight[],
    chunkText: string,
    userQuery: string
  ): IHighlight | null {
    if (!localized.length) return null;
    let best: IHighlight | null = null;
    let bestScore = -1;
    for (const h of localized) {
      const hText = h?.content?.text || "";
      const s1 = scoreOverlap(hText, chunkText);
      const s2 = scoreOverlap(hText, userQuery);
      const s = s1 * 0.7 + s2 * 0.3;
      if (s > bestScore) {
        bestScore = s;
        best = h;
      }
    }
    return best || localized[0];
  }

  // ===== Cross-document SEARCH with "~" vector-only toggle =====
  const handleSearch = async () => {
    const raw = searchTerm.trim();
    if (!raw) return;

    const forceVector = raw.startsWith("~");
    const term = forceVector ? raw.slice(1).trim() : raw;

    if (!searchMode) {
      setPreSearchState({ pdfId, pdfName, pdfUrl, pdfOcrUrl, highlights });
    }
    setSearchMode(true);
    setHighlights([]); // hide current marks immediately

    const keywords = term.split("|").map((s) => s.trim()).filter(Boolean);

    const docsList: DocState[] = Object.values(docs).length
      ? Object.values(docs)
      : pdfId && pdfUrl
      ? [{ pdfId, name: pdfName ?? "", fileUrl: pdfUrl, ocrUrl: pdfOcrUrl, highlights: [] }]
      : [];

    const results: IHighlight[] = [];
    const ownerMap: Record<string, string> = {};
    let uid = 0;

    // 1) Keyword search across all docs (unless forcing vector)
    if (!forceVector) {
      for (const d of docsList) {
        if (!d.fileUrl) continue;
        let hits: IHighlight[] = await searchPdf(keywords, d.fileUrl, 1);
        if (hits.length === 0 && d.ocrUrl) {
          hits = await searchPdf(keywords, d.ocrUrl, 1);
        }
        for (const h of hits) {
          const id = (h.id as string) || `${d.pdfId}-${Date.now()}-${uid++}`;
          const page =
            (h as any)?.position?.pageNumber ??
            (h as any)?.position?.pageNumberMaybe;
          const prefix = `${d.name}${page ? ` · p.${page}` : ""}`;
          const combinedText = `${prefix} — ${h.content?.text ?? ""}`;
          const withId: IHighlight = {
            ...h,
            id,
            comment: { text: "" },
            content: { ...h.content, text: combinedText },
          };
          results.push(withId);
          ownerMap[id] = d.pdfId;
        }
      }
    }

    // 2) Semantic vectors if no keyword hits OR explicitly forced
    if (results.length === 0 || forceVector) {
      try {
        const vecHits = await semanticSearchAllDocs(term, docsList, 30);
        for (const vh of vecHits) {
          const d = docsList.find((x) => x.pdfId === vh.pdfId);
          if (!d?.fileUrl) continue;

          const probes = pickProbeWords(vh.text, 6);
          let localized: IHighlight[] = await searchPdf(probes, d.fileUrl, 1);
          if (localized.length === 0 && d.ocrUrl) {
            localized = await searchPdf(probes, d.ocrUrl, 1);
          }
          localized = localized.filter((h: any) => {
            const page =
              h?.position?.pageNumber ?? h?.position?.pageNumberMaybe;
            return page === vh.page;
          });

          const h = chooseBestLocalizedHighlight(localized, vh.text, term);
          if (!h) continue;

          const id = (h.id as string) || `${d.pdfId}-sem-${Date.now()}-${uid++}`;
          const page =
            (h as any)?.position?.pageNumber ??
            (h as any)?.position?.pageNumberMaybe;
          const prefix = `${d.name}${page ? ` · p.${page}` : ""}`;
          const combinedText = `${prefix} — ${h.content?.text ?? ""}`;
          const withId: IHighlight = {
            ...h,
            id,
            comment: { text: "" },
            content: { ...h.content, text: combinedText },
          };
          results.push(withId);
          ownerMap[id] = d.pdfId;
        }
      } catch {}
    }

    setHighlightOwner(ownerMap);
    setHighlights(results);
  };

  const exitSearchMode = () => {
    setSearchMode(false);
    setHighlightOwner({});
    if (preSearchState) {
      const { pdfId: pid, pdfName: pname, pdfUrl: purl, pdfOcrUrl: porc, highlights: hs } =
        preSearchState;
      if (pid) switchDoc(pid);
      setPdfName(pname);
      setPdfUrl(purl);
      setPdfOcrUrl(porc);
      setPdfId(pid);
      setHighlights(hs || []);
    }
    setPreSearchState(null);
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
    if (!highlightId) return;
    const owner = highlightOwner[highlightId];
    if (owner && owner !== pdfId) {
      const h = highlights.find((x) => x.id === highlightId);
      if (h) setPendingScrollTo(h);
      switchDoc(owner);
      return;
    }
    const highlight = highlights.find((h) => h.id === highlightId);
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  }, [highlightOwner, pdfId, highlights]);

  useEffect(() => {
    if (!pendingScrollTo) return;
    setTimeout(() => {
      try {
        pdfViewerRef.current?.scrollTo?.(pendingScrollTo);
      } catch {}
      setPendingScrollTo(null);
    }, 0);
  }, [pendingScrollTo]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash, false);
    };
  }, [scrollToHighlightFromHash]);

  return (
    <div className="flex min-h-screen bg-[linear-gradient(120deg,_rgb(249_250_251)_50%,_rgb(239_246_255)_50%)]">
      <button
        type="button"
        aria-label="Open documents menu"
        onClick={() => setShowDocsMenu((s) => !s)}
        className="fixed left-2 top-2 z-30 border rounded px-2 py-1 bg-white"
      >
        ☰
      </button>

      {showDocsMenu && (
        <div className="fixed left-2 top-10 z-30 bg-white border shadow rounded max-h-[60vh] overflow-auto w-[280px]">
          <div className="p-2 font-semibold border-b">Documents</div>
          <ul>
            {Object.values(docs).map((doc) => (
              <li key={doc.pdfId}>
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                    pdfId === doc.pdfId ? "font-bold underline" : ""
                  }`}
                  onClick={() => {
                    switchDoc(doc.pdfId);
                    setShowDocsMenu(false);
                  }}
                >
                  {doc.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1">
        <div className="mb-8 sticky top-0">
          <Header />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 mb-8">
          <div className="max-w-xl mx-auto space-y-6">
            <PdfUploader onFileUpload={handleFileUpload} pdfUploaded={pdfUploaded} />

            <KeywordSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
              resetHighlights={searchMode ? exitSearchMode : resetHighlights}
            />

            {pdfId && !searchMode && (
              <HighlightUploader
                onFileUpload={handleHighlightUpload}
                highlights={highlights}
                pdfId={pdfId}
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
              // extended props on your PdfViewer variant
              searchMode={searchMode}
              highlightOwner={highlightOwner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
