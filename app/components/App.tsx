// app/components/App.tsx
"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import PdfUploader from "./PdfUploader";
import KeywordSearch from "./KeywordSearch";
import PdfViewer from "./PdfViewer";
import { Header } from "./Header";
import Spinner from "./Spinner";
import { convertPdfToBase64, convertPdfToImages, getOcrPdf, searchPdf } from "../utils/pdfUtils";
import type { IHighlight } from "react-pdf-highlighter";
import HighlightUploader from "./HighlightUploader";
import { StoredHighlight, StoredPdf, StorageMethod } from "../utils/types";
import {
  DataUrlToBlob,
  IHighlightToStoredHighlight,
  StoredHighlightToIHighlight,
} from "../utils/utils";
import { createWorker } from "tesseract.js";
// import { useSession } from "next-auth/react";
import { getPdfId } from "../utils/pdfUtils";
import { debugOcrPdfEnabled, storageMethod } from "../utils/env";

export default function App() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOcrUrl, setPdfOcrUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [highlightUrl, setHighlightUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [storedHighlights, setStoredHighlights] = useState<Array<StoredHighlight>>([]);
  const [highlightsKey, setHighlightsKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef<any>(null);
  // const session = useSession();

  useEffect(() => {
    setHighlightsKey((prev) => prev + 1);
  }, [highlights]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    let fileUrl = URL.createObjectURL(file);
    const pdfId = getPdfId(
      file.name,
      /* session.data?.user?.email ?? */ undefined
    );
    if (debugOcrPdfEnabled) {
      // Creating a searchable PDF:
      // Convert uploaded PDF file to b64 image,
      //   perform OCR,
      //   convert output back to PDF
      //   update file url with new PDF url
      const ocrPdf = await getOcrPdf(file);
      if (ocrPdf) {
        // Update file url if OCR success
        setPdfOcrUrl(URL.createObjectURL(ocrPdf));

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
    }
    
    fetch("/api/pdf/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pdfId,
        name: file.name,
        base64: await convertPdfToBase64(file),
      }),
    })
    .then((res) => {
      if (res.ok) {
        setPdfUrl(fileUrl);
        setPdfUploaded(true);
        setPdfName(file.name);
        setPdfId(pdfId);
        setLoading(false);
      } else {
        throw new Error("Failed to upload PDF to database");
      }
    });
  };

  useEffect(() => {
    const getHighlights = async () => {
      if (!pdfName) {
        return;
      }
      const res = await fetch("/api/highlight/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({pdfId: pdfId}),
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

  const saveHighlights = async (id: string, highlights: StoredHighlight[]) => {
    const body =
      storageMethod === StorageMethod.sqlite
        ? {
            id,
            highlights: highlights,
          }
        : highlights;
    await fetch("/api/highlight/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

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
      if (debugOcrPdfEnabled && newHighlights.length === 0 && pdfOcrUrl) {
        // Try searching the OCR pdf
        // This step is sometimes required due to the OCR process
        //   possibly being lossy (pdf -> png -> pdf)
        //   which means some words are missing/malformed
        newHighlights = await searchPdf(keywords, pdfOcrUrl, currentZoom);
      }

      let newStoredHighlights = newHighlights.map((highlight) => {
        if (pdfId) {
          return IHighlightToStoredHighlight(highlight, pdfId);
        }
      }).filter((highlight) => highlight !== undefined) as StoredHighlight[];

      if(pdfId) {
        saveHighlights(pdfId, newStoredHighlights);
      }

      const res = await fetch("/api/pdf/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 20
        }),
      });

      if (res.ok) {
        const body = await res.json();
        for (const pdf of body as StoredPdf[]) {
          if (pdf.id === pdfId) {
            continue;
          }
          const dataUrl = "data:application/pdf;base64," + pdf.base64;
          let blobUrl = URL.createObjectURL(await DataUrlToBlob(dataUrl));
          let extraHighlights = await searchPdf(keywords, blobUrl, 1);
          if (debugOcrPdfEnabled && extraHighlights.length === 0) {
            const ocrPdf = await getOcrPdf((await DataUrlToBlob(dataUrl)) as File);
            if (ocrPdf) {
              const ocrPdfUrl = URL.createObjectURL(ocrPdf);
              extraHighlights = await searchPdf(keywords, ocrPdfUrl, 1);
            }
          }
          let extraStoredHighlights = extraHighlights.map((highlight) => {
            return IHighlightToStoredHighlight(highlight, pdf.id);
          });
          newStoredHighlights = [...newStoredHighlights, ...extraStoredHighlights];
          saveHighlights(pdf.id, extraStoredHighlights);
          const res2 = await fetch("/api/highlight/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({pdfId: pdf.id}),
          });
          if (res2.ok) {
            const resHighlights = await res2.json();
            if (resHighlights) {
              newStoredHighlights = [...newStoredHighlights, ...resHighlights];
            }
          }
        }
      } else {
        throw new Error("Failed to get PDF from database")
      }

      if (pdfName && pdfId) {
        let updatedStoredHighlights = highlights.map((highlight) => {
          return IHighlightToStoredHighlight(highlight, pdfId);
        }).filter((highlight) => highlight !== undefined) as StoredHighlight[];
        updatedStoredHighlights = [...updatedStoredHighlights, ...newStoredHighlights];
        setStoredHighlights(updatedStoredHighlights);
      }

      const updatedHighlights = [...highlights, ...newHighlights];

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

  const changeCurrentPdf = async (pdfId: string) => {
    const res = await fetch("/api/pdf/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pdfId,
        amount: 1
      }),
    });
    if (res.ok) {
      setPdfUploaded(false);
      setLoading(true);
      const body = await res.json();
      const pdf = body as StoredPdf;
      const dataUrl = "data:application/pdf;base64," + pdf.base64;
      let blob = await DataUrlToBlob(dataUrl);
      let blobUrl = URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
      setPdfUploaded(true);
      setPdfName(pdf.name);
      setPdfId(pdf.id);
      setLoading(false);
    }
  }

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
              storedHighlights={storedHighlights}
              setStoredHighlights={setStoredHighlights}
              setHighlights={setHighlights}
              highlightsKey={highlightsKey}
              pdfViewerRef={pdfViewerRef}
              resetHash={resetHash}
              scrollViewerTo={scrollViewerTo}
              scrollToHighlightFromHash={scrollToHighlightFromHash}
              changeCurrentPdf={changeCurrentPdf}
            />
          )}
        </div>
      </div>
    </div>
  );
}
