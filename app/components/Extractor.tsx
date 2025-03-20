// components/Extractor.tsx
"use client";

import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set up the PDF worker using a local file in the public folder.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface ExtractorProps {
  file: File | null;
  onExtracted?: (message: string) => void;
}

const Extractor: React.FC<ExtractorProps> = ({ file, onExtracted }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    const extractWords = async () => {
      setError(null);
      try {
        // Read the file as an ArrayBuffer.
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF from the ArrayBuffer.
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";

        // Iterate through all pages and extract text.
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += " " + pageText;
        }

        // Send the extracted text back to the parent as context.
        if (onExtracted) {
          onExtracted(fullText.trim());
        }
      } catch (err: any) {
        console.error("Error extracting words from PDF:", err);
        setError("Error reading PDF: " + err.message);
      }
    };

    extractWords();
  }, [file, onExtracted]);

  // Only render an error message (if one exists); otherwise render nothing.
  return error ? <div className="text-red-500 mt-2">{error}</div> : null;
};

export default Extractor;
