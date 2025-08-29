// app/utils/pdfUtils.ts
import { IHighlight } from "react-pdf-highlighter";
import { cosineSimilarity, computeTextEmbedding, computeImageEmbedding } from "./openclip";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Matrix multiply: current * next  (PDF 3x3 affine compact [a,b,c,d,e,f])
const mul = (m1: number[], m2: number[]) => [
  m1[0] * m2[0] + m1[2] * m2[1],
  m1[1] * m2[0] + m1[3] * m2[1],
  m1[0] * m2[2] + m1[2] * m2[3],
  m1[1] * m2[2] + m1[3] * m2[3],
  m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
  m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
];

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

type ExtractedImage = { pageNumber: number; image: string; transform: number[] };

// Extracts images and returns base64 + CTM (current transform) at paint time
export async function extractImagesFromPdf(pdfUrl: string): Promise<ExtractedImage[]> {
  const pdf = await pdfjs.getDocument(pdfUrl).promise;
  const out: ExtractedImage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const ops = await page.getOperatorList();

    const stack: number[][] = [];
    let ctm = [1, 0, 0, 1, 0, 0]; // identity

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      if (fn === pdfjs.OPS.save) {
        stack.push([...ctm]);
      } else if (fn === pdfjs.OPS.restore) {
        ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
      } else if (fn === pdfjs.OPS.transform) {
        ctm = mul(ctm, args as number[]);
      } else if (fn === pdfjs.OPS.paintImageXObject) {
        const name = args[0];

        const bitmap: ImageBitmap = await new Promise((resolve, reject) => {
          page.objs.get(name, async (obj: any) => {
            try {
              if (obj instanceof ImageBitmap) return resolve(obj);
              if (obj?.bitmap instanceof ImageBitmap) return resolve(obj.bitmap);
              const created = await createImageBitmap(obj as ImageBitmapSource);
              resolve(created);
            } catch (e) {
              reject(e);
            }
          });
        });

        const base64 = await convertImageBitmapToBase64(bitmap);
        out.push({ pageNumber, image: base64, transform: [...ctm] });
      }
    }
  }

  return out;
}

export async function getImagesByPage(pdfUrl: string): Promise<Record<number, string[]>> {
  const images = await extractImagesFromPdf(pdfUrl); // you already return {pageNumber, image, ...}
  const byPage: Record<number, string[]> = {};
  for (const it of images) {
    if (!byPage[it.pageNumber]) byPage[it.pageNumber] = [];
    byPage[it.pageNumber].push(it.image);
  }
  return byPage;
}

// Find images in a PDF that semantically match the given keywords using CLIP embeddings
export const searchImages = async (keywords: string[],  pdfUrl: string,  viewportZoom: number = 1): Promise<IHighlight[]> => {
  const highlights: IHighlight[] = [];

  // 1) Get CLIP text embeddings for all keywords, once
  const keywordEmbeddings = await Promise.all(
    keywords.map((kw) => computeTextEmbedding(kw))
  );

  // 2) Extract all images (base64 + CTM)
  const extracted = await extractImagesFromPdf(pdfUrl);

  // 3) PDF handle for viewports
  const pdf = await pdfjs.getDocument(pdfUrl).promise;

  for (const info of extracted) {
    const { image, pageNumber, transform } = info;

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: viewportZoom });

    // 4) CLIP image embedding
    const imgEmbedding = await computeImageEmbedding(image);

    // 5) Compare against all keyword embeddings — keep best score
    let best = -Infinity;
    for (const kw of keywordEmbeddings) {
      const score = cosineSimilarity(imgEmbedding, kw);
      if (score > best) best = score;
    }

    // 6) Threshold (tune if needed)
    const THRESHOLD = 0.25;
    if (best < THRESHOLD) continue;

    // 7) Build rectangle from CTM corners (no manual Y-flip needed)
    const [a, b, c, d, e, f] = transform;
    const toVp = (x: number, y: number) => viewport.convertToViewportPoint(x, y);

    const p1 = toVp(e, f);                 // (0,0)
    const p2 = toVp(e + a, f + b);         // (1,0)
    const p3 = toVp(e + c, f + d);         // (0,1)
    const p4 = toVp(e + a + c, f + b + d); // (1,1)

    const xs = [p1[0], p2[0], p3[0], p4[0]];
    const ys = [p1[1], p2[1], p3[1], p4[1]];

    const x1 = Math.min(...xs);
    const y1 = Math.min(...ys);
    const x2 = Math.max(...xs);
    const y2 = Math.max(...ys);

    highlights.push({
      id: String(Math.random()).slice(2),
      content: { text: keywords[0] ?? "" },
      comment: { text: "Matched an image", emoji: "🖼️" },
      position: {
        boundingRect: {
          x1, y1, x2, y2,
          width: viewport.width,
          height: viewport.height,
          pageNumber,
        },
        rects: [
          {
            x1, y1, x2, y2,
            width: viewport.width,
            height: viewport.height,
            pageNumber,
          },
        ],
        pageNumber,
      },
    });
  }

  return highlights;
};

export async function getPageTexts(pdfUrl: string): Promise<Array<{ pageNumber: number; text: string }>> {
  const pdf = await pdfjs.getDocument(pdfUrl).promise;
  const out: Array<{ pageNumber: number; text: string }> = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const tc = await page.getTextContent();
    const text = (tc.items as any[]).map((i) => i.str).join(" ");
    out.push({ pageNumber, text });
  }
  return out;
}


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
