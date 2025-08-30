// app/utils/pdfUtils.ts
import { IHighlight } from "react-pdf-highlighter";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// TODO: Consider using a library like 'google-ocr' for more accurate text recognition
// and cases where text is not embedded in the pdf itself (e.g. scanned document)

/**
 * Extract per-page text from the PDF's existing text layer (no OCR).
 * Returns an array of { page, text }.
 */
export const extractPagesText = async (
  pdfUrl: string
): Promise<Array<{ page: number; text: string }>> => {
  const pdf = await pdfjs.getDocument(pdfUrl as any).promise;
  const pages: Array<{ page: number; text: string }> = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent({ normalizeWhitespace: true });
    const text = (textContent.items as any[])
      .map((i) => (i && typeof i.str === "string" ? i.str : ""))
      .join(" ")
      .trim();
    pages.push({ page: p, text });
  }
  return pages;
};

/**
 * Searches a PDF for given keywords and returns highlights
 * @param keywords - Array of strings to search for
 * @param pdfUrl - URL of the PDF to search
 * @param viewportZoom - Zoom level for the viewport (default: 1)
 * @returns Promise resolving to an array of IHighlight objects
 */
export const searchPdf = async (
  keywords: string[],
  pdfUrl: string,
  viewportZoom: number = 1
): Promise<IHighlight[]> => {
  const highlights: IHighlight[] = [];

  try {
    // Load the PDF document
    const pdf = await pdfjs.getDocument(pdfUrl).promise;
    const numPages = pdf.numPages;

    // Iterate through each page of the PDF
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: viewportZoom });

      // Create an adjusted viewport to flip the y-coordinate
      // FIXME: This might not be necessary or correct for all PDFs
      const adjustedViewport = {
        ...viewport,
        convertToViewportPoint: (x: number, y: number) => {
          const [vx, vy] = viewport.convertToViewportPoint(x, y);
          return [vx, viewport.height - vy];
        },
      };

      // Extract text content from the page
      const textContent = await page.getTextContent();
      const textItems = textContent.items as any[];

      let lastY: number | null = null;
      let textLine = "";
      let lineItems: any[] = [];

      // Group text items into lines
      for (const item of textItems) {
        if (lastY !== item.transform[5] && lineItems.length > 0) {
          // Process the completed line
          processLine(
            lineItems,
            textLine,
            keywords,
            pageNum,
            highlights,
            adjustedViewport
          );
          textLine = "";
          lineItems = [];
        }
        textLine += item.str;
        lineItems.push(item);
        lastY = item.transform[5];
      }

      // Process the last line if it exists
      if (lineItems.length > 0) {
        processLine(
          lineItems,
          textLine,
          keywords,
          pageNum,
          highlights,
          adjustedViewport
        );
      }
    }
  } catch (error) {
    console.error("Error searching PDF:", error);
  }

  return highlights;
};

/**
 * Processes a line of text to find and create highlights for matching keywords
 * @param lineItems - Array of text items in the line
 * @param text - Concatenated text of the line
 * @param keywords - Array of keywords to search for
 * @param pageNumber - Current page number
 * @param highlights - Array to store created highlights
 * @param viewport - Adjusted viewport for coordinate conversion
 */
const processLine = (
  lineItems: any[],
  text: string,
  keywords: string[],
  pageNumber: number,
  highlights: IHighlight[],
  viewport: any
) => {
  keywords.forEach((keyword) => {
    // FIXME: This regex might need to be adjusted for more accurate matching
    const regex = new RegExp(keyword, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      let startItem = lineItems[0];
      let endItem = lineItems[lineItems.length - 1];

      // Find the start and end items for the matched keyword
      let currentIndex = 0;
      for (const item of lineItems) {
        if (
          currentIndex + item.str.length > startIndex &&
          startItem === lineItems[0]
        ) {
          startItem = item;
        }
        if (currentIndex + item.str.length >= endIndex) {
          endItem = item;
          break;
        }
        currentIndex += item.str.length;
      }

      // Calculate coordinates for the highlight
      // FIXME: These calculations might not be accurate for all PDFs
      const x1 = startItem.transform[4];
      const y1 = startItem.transform[5];
      const x2 = endItem.transform[4] + endItem.width;
      const y2 =
        startItem.transform[5] +
        Math.max(...lineItems.map((item) => item.height));

      // Convert coordinates to viewport points
      const [tx1, ty1] = [x1, y1];
      const [tx2, ty2] = [x2, y2];

      // Flip y-coordinates
      // FIXME: This flipping might not be necessary or correct for all PDFs
      const flippedY1 = viewport.height - ty1;
      const flippedY2 = viewport.height - ty2;

      // Create and add the highlight
      highlights.push({
        content: { text: match[0] },
        position: {
          boundingRect: {
            x1: tx1,
            y1: Math.min(flippedY1, flippedY2),
            x2: tx2,
            y2: Math.max(flippedY1, flippedY2),
            width: viewport.width,
            height: viewport.height,
            pageNumber,
          },
          rects: [
            {
              x1: tx1,
              y1: Math.min(flippedY1, flippedY2),
              x2: tx2,
              y2: Math.max(flippedY1, flippedY2),
              width: viewport.width,
              height: viewport.height,
              pageNumber,
            },
          ],
          pageNumber,
        },
        comment: { text: `Found "${match[0]}"`, emoji: "🔍" },
        id: getNextId(),
      });
    }
  });
};

/**
 * Generates a unique ID for highlights
 * @returns A string representing a unique ID
 */
const getNextId = () => String(Math.random()).slice(2);

export const getPdfId = (pdfName: string, email?: string) =>
  email
    ? `${pdfName.replace(".", "__")}__${email
        .replace("@", "__at__")
        .replace(".", "__")}`
    : pdfName.replace(".", "__");

// https://stackoverflow.com/a/65985452
const readFileData = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e?.target?.result);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};

export const convertPdfToImages = async (file: File) => {
  const data = await readFileData(file);
  if (!data) {
    return [];
  }
  const images: string[] = [];
  const pdf = await pdfjs.getDocument(data as any).promise;
  const canvas = document.createElement("canvas");
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1 });
    const context = canvas.getContext("2d");
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL());
    }
  }
  canvas.remove();
  return images;
};
