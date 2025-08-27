// app/utils/pdfImages.ts
import * as pdfjs from "pdfjs-dist";
import { IHighlight } from "react-pdf-highlighter";
import { computeTextEmbedding, computeImageEmbedding, cosineSimilarity } from "./openclip";

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

export async function extractImagesFromPdf(pdfUrl: string) {
  const pdf = await pdfjs.getDocument(pdfUrl).promise;
  const results: Array<{ pageNumber: number; image: string; x: number; y: number; width: number; height: number }> = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) {
        const name = ops.argsArray[i][0];

        const bitmap: ImageBitmap = await new Promise((resolve, reject) => {
          page.objs.get(name, (bm: ImageBitmap) => (bm ? resolve(bm) : reject(new Error(`no bitmap for ${name}`))));
        });

        const base64 = await imageBitmapToDataUrl(bitmap);

        // best-effort transform position
        let x = 0, y = 0;
        for (let j = i - 1; j >= 0; j--) {
          if (ops.fnArray[j] === pdfjs.OPS.transform) {
            const t = ops.argsArray[j];
            x = t[4] ?? 0;
            y = t[5] ?? 0;
            break;
          }
        }
        results.push({ pageNumber, image: base64, x, y, width: bitmap.width, height: bitmap.height });
      }
    }
  }
  return results;
}

async function imageBitmapToDataUrl(bitmap: ImageBitmap): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function searchImages(
  keywords: string[],
  pdfUrl: string,
  viewportZoom = 1,
): Promise<IHighlight[]> {
  const out: IHighlight[] = [];
  const pdf = await pdfjs.getDocument(pdfUrl).promise;

  // one text embedding for the whole query set (simple: join)
  const text = keywords.join(" ");
  const textEmb = await computeTextEmbedding(text);

  const images = await extractImagesFromPdf(pdfUrl);
  const threshold = 0.25; // tune later / make env-driven

  for (const img of images) {
    const imgEmb = await computeImageEmbedding(img.image);
    const score = cosineSimilarity(textEmb, imgEmb);

    if (score >= threshold) {
      const page = await pdf.getPage(img.pageNumber);
      const viewport = page.getViewport({ scale: viewportZoom });

      // flip PDF y to viewer space
      const x1 = img.x;
      const y1 = img.y - img.height;
      const x2 = img.x + img.width;
      const y2 = img.y;

      out.push({
        id: Math.random().toString().slice(2),
        content: { text: text },
        comment: { text: `Image match (${score.toFixed(2)})`, emoji: "🖼️" },
        position: {
          boundingRect: {
            x1,
            y1,
            x2,
            y2,
            width: viewport.width,
            height: viewport.height,
            pageNumber: img.pageNumber,
          },
          rects: [
            {
              x1,
              y1,
              x2,
              y2,
              width: viewport.width,
              height: viewport.height,
              pageNumber: img.pageNumber,
            },
          ],
          pageNumber: img.pageNumber,
        },
      });
    }
  }
  return out;
}
