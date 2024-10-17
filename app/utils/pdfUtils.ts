// app/utils/pdfUtils.ts
import { IHighlight } from "react-pdf-highlighter";
import * as pdfjs from "pdfjs-dist";
import { computeTextEmbedding, computeImageEmbedding, cosineSimilarity } from "./openclip";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

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


// Function to search for images within the PDF based on the provided keywords
export const searchImages = async (
  keywords: string[],
  pdfUrl: string,
  viewportZoom: number = 1,
): Promise<IHighlight[]> => {
  const highlights: IHighlight[] = [];

  try {
    // Compute embeddings for the search keywords
    const keywordEmbeddingsPromises = keywords.map((keyword) =>
      computeTextEmbedding(keyword)
    );
    const keywordEmbeddings = await Promise.all(keywordEmbeddingsPromises);

    // Extract images from the PDF
    const extractedImages = await extractImagesFromPdf(pdfUrl);

    // Iterate through each extracted image
    for (const imageInfo of extractedImages) {
      const { image, x, y, width, height, pageNumber } = imageInfo;

      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: viewportZoom });

      const adjustedViewport = {
        ...viewport,
        convertToViewportPoint: (x: number, y: number) => {
          const [vx, vy] = viewport.convertToViewportPoint(x, y);
          return [vx, viewport.height - vy];
        },
      };

      // Compute the embedding for the extracted image using MobileNet
      const imageEmbedding = await computeImageEmbedding(image);

      // Compare the image embedding with each keyword embedding
      let bestMatch = -Infinity;
      for (const keywordEmbedding of keywordEmbeddings) {
        if (imageEmbedding && keywordEmbedding) {
          const similarityScore = cosineSimilarity(imageEmbedding, keywordEmbedding);
          console.log(similarityScore)
          if (similarityScore > bestMatch) {
            bestMatch = similarityScore;
          }
        }
      }

      // If the best match exceeds a certain threshold, consider it a match
      const threshold = 0.25;
      if (bestMatch >= threshold) {
        const tx1 = x;
        const ty1 = y - height;
        const tx2 = x + width;
        const ty2 = y;

        highlights.push({
          content: { text: keywords[0] },
          position: {
            boundingRect: {
              x1: tx1,
              y1: ty1,
              x2: tx2,
              y2: ty2,
              width: adjustedViewport.width,
              height: adjustedViewport.height,
              pageNumber,
            },
            rects: [
              {
                x1: tx1,
                y1: ty1,
                x2: tx2,
                y2: ty2,
                width: adjustedViewport.width,
                height: adjustedViewport.height,
                pageNumber,
              },
            ],
            pageNumber,
          },
          comment: { text: `Matched an image`, emoji: "🖼️" },
          id: getNextId(),
        });
      }
    }
  } catch (error) {
    console.error("Error searching images:", error);
  }

  return highlights;
};


// Function to handle ImageBitmap objects in PDF.js
export async function extractImagesFromPdf(pdfUrl: string) {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }

  const pdfDocument = await pdfjs.getDocument(pdfUrl).promise;

  const images: Array<{ pageNumber: number; image: any; x: number; y: number; width: number; height: number }> = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const ops = await page.getOperatorList();
    
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) {
        const imageName = ops.argsArray[i][0];
        
        try {
          // Wait for the image to be fully resolved
          const imageBitmap = await new Promise<ImageBitmap>((resolve, reject) => {
            page.objs.get(imageName, (bitmap: ImageBitmap) => {
              if (bitmap) resolve(bitmap);
              else reject(new Error(`Failed to resolve image ${imageName}`));
            });
          });

          // If the imageBitmap is valid, convert it to base64 using a canvas
          const base64Image = await convertImageBitmapToBase64(imageBitmap);

          let { width, height } = imageBitmap;
          let x = 0, y = 0;

          // Check if there's a transform property
          if (typeof imageBitmap === 'object' && imageBitmap !== null && 'transform' in imageBitmap && Array.isArray(imageBitmap.transform)) {
            [x, y] = imageBitmap.transform.slice(4, 6);
          } else {
            // If no transform, try to get position from the previous "cm" operator
            for (let j = i - 1; j >= 0; j--) {
              if (ops.fnArray[j] === pdfjs.OPS.transform) {
                const transform = ops.argsArray[j];
                x = transform[4] || 0;
                y = transform[5] || 0;
                break;
              }
            }
          }

          // Push the raw image data without any transformations
          images.push({
            pageNumber: pageNum,
            image: base64Image, // Base64 representation of the image
            x,                  // Raw x-coordinate
            y,                  // Raw y-coordinate
            width,              // Raw width
            height,             // Raw height
          });
        } catch (error) {
          console.error(`Failed to process image ${imageName} on page ${pageNum}:`, error);
        }
      }
    }
  }
  console.log(images);
  return images;
}


export const convertImageBitmapToBase64 = async (imageObject: any): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // If imageObject is not an ImageBitmap, convert it to one
  let imageBitmap: ImageBitmap;

  if (imageObject instanceof ImageBitmap) {
    imageBitmap = imageObject; // If it's already an ImageBitmap, use it
  } else if (imageObject.bitmap) {
    // If the object has a bitmap property, use that
    imageBitmap = imageObject.bitmap;
  } else {
    // If it's not an ImageBitmap, attempt to convert it to one
    try {
      imageBitmap = await createImageBitmap(imageObject);
    } catch (error) {
      console.error("Error creating ImageBitmap:", error);
      throw new Error("Unable to convert object to ImageBitmap");
    }
  }

  // Set canvas dimensions based on the ImageBitmap
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  // Draw the ImageBitmap onto the canvas
  ctx?.drawImage(imageBitmap, 0, 0);

  // Convert the canvas to a base64 string
  return canvas.toDataURL("image/png");
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

