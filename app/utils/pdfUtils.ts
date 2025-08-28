// app/utils/pdfUtils.ts
import { IHighlight } from "react-pdf-highlighter";
import { cosineSimilarity, computeTextEmbedding, computeImageEmbedding } from "./openclip";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Normalizes whatever pdf.js gives us to a real ImageBitmap, then to base64
export const convertImageBitmapToBase64 = async (imageObject: any): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let imageBitmap: ImageBitmap;
  if (imageObject instanceof ImageBitmap) {
    imageBitmap = imageObject;
  } else if (imageObject?.bitmap instanceof ImageBitmap) {
    imageBitmap = imageObject.bitmap;
  } else {
    try {
      imageBitmap = await createImageBitmap(imageObject);
    } catch (error) {
      console.error("Error creating ImageBitmap:", error);
      throw new Error("Unable to convert object to ImageBitmap");
    }
  }

  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  ctx?.drawImage(imageBitmap, 0, 0);

  return canvas.toDataURL("image/png");
};

// Extracts images from a PDF and returns base64 + raw coords/dimensions
export async function extractImagesFromPdf(pdfUrl: string) {
  const pdfDocument = await pdfjs.getDocument(pdfUrl).promise;
  const images: Array<{ pageNumber: number; image: string; x: number; y: number; width: number; height: number }> = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) {
        const imageName = ops.argsArray[i][0];

        // Resolve to a real ImageBitmap (handles wrapper objects too)
        const imageBitmap: ImageBitmap = await new Promise((resolve, reject) => {
          page.objs.get(imageName, async (obj: any) => {
            try {
              if (obj instanceof ImageBitmap) return resolve(obj);
              if (obj?.bitmap instanceof ImageBitmap) return resolve(obj.bitmap);
              const created = await createImageBitmap(obj);
              resolve(created);
            } catch (e) {
              reject(e);
            }
          });
        });

        const base64 = await convertImageBitmapToBase64(imageBitmap);

        // Default position
        let x = 0, y = 0;

        // Try to read transform ("cm") right before paint op to get x/y
        for (let j = i - 1; j >= 0; j--) {
          if (ops.fnArray[j] === pdfjs.OPS.transform) {
            const t = ops.argsArray[j];
            x = t?.[4] ?? 0;
            y = t?.[5] ?? 0;
            break;
          }
        }

        images.push({
          pageNumber,
          image: base64,
          x,
          y,
          width: imageBitmap.width,
          height: imageBitmap.height,
        });
      }
    }
  }

  return images;
}

// Find images in a PDF that semantically match the given keywords using CLIP embeddings
export const searchImages = async (
  keywords: string[],
  pdfUrl: string,
  viewportZoom: number = 1
): Promise<IHighlight[]> => {
  const highlights: IHighlight[] = [];

  // 1) Get CLIP text embeddings for all keywords, once
  const keywordEmbeddings = await Promise.all(
    keywords.map((kw) => computeTextEmbedding(kw))
  );

  // 2) Extract all images from the PDF (as base64 with raw positions)
  const extracted = await extractImagesFromPdf(pdfUrl);

  // 3) We’ll need a viewport to size the highlight rectangles correctly
  const pdf = await pdfjs.getDocument(pdfUrl).promise;

  for (const info of extracted) {
    const { image, x, y, width, height, pageNumber } = info;

    // Get page + viewport for this page
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: viewportZoom });

    // pdf.js y-origin is bottom-left; most viewers expect top-left. We flip y via convertToViewportPoint.
    const [vx1, vy1] = viewport.convertToViewportPoint(x, y - height);
    const [vx2, vy2] = viewport.convertToViewportPoint(x + width, y);

    // 4) CLIP image embedding
    const imgEmbedding = await computeImageEmbedding(image); // accepts base64 "data:image/png;..."

    // 5) Compare against all keyword embeddings — keep best score
    let best = -Infinity;
    for (const kw of keywordEmbeddings) {
      const score = cosineSimilarity(imgEmbedding, kw);
      if (score > best) best = score;
    }

    // 6) Threshold (tune if needed)
    const THRESHOLD = 0.25;
    if (best >= THRESHOLD) {
      // Build a highlight rectangle
      const tx1 = Math.min(vx1, vx2);
      const ty1 = Math.min(vy1, vy2);
      const tx2 = Math.max(vx1, vx2);
      const ty2 = Math.max(vy1, vy2);

      highlights.push({
        id: String(Math.random()).slice(2),
        content: { text: keywords[0] ?? "" },
        comment: { text: "Matched an image", emoji: "🖼️" },
        position: {
          boundingRect: {
            x1: tx1,
            y1: ty1,
            x2: tx2,
            y2: ty2,
            width: viewport.width,
            height: viewport.height,
            pageNumber,
          },
          rects: [
            {
              x1: tx1,
              y1: ty1,
              x2: tx2,
              y2: ty2,
              width: viewport.width,
              height: viewport.height,
              pageNumber,
            },
          ],
          pageNumber,
        },
      });
    }
  }

  return highlights;
};



// TODO: Consider using a library like 'google-ocr' for more accurate text recognition
// and cases where text is not embedded in the pdf itself (e.g. scanned document)

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
  viewportZoom: number = 1,
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
            adjustedViewport,
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
          adjustedViewport,
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
  viewport: any,
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
    ? `${pdfName.replace(".", "__")}__${email.replace("@", "__at__").replace(".", "__")}`
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
  const pdf = await pdfjs.getDocument(data).promise;
  const canvas = document.createElement("canvas");
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1 });
    const context = canvas.getContext("2d");
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      images.push(canvas.toDataURL());
    }
  }
  canvas.remove();
  return images;
};
