// app/utils/indexer.ts
import * as pdfjs from 'pdfjs-dist';
import { computeTextEmbedding, computeImageEmbedding } from './openclip';
import { extractImagesFromPdf } from './pdfUtils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

async function extractPageText(page: any) {
  const textContent = await page.getTextContent();
  const items = textContent.items as any[];
  return items.map((i) => i.str).join(' ').trim();
}

export async function buildPageEmbeddings(pdfUrl: string) {
  const doc = await pdfjs.getDocument(pdfUrl).promise;
  const numPages = doc.numPages;

  // Image base64s by page
  const images = await extractImagesFromPdf(pdfUrl);
  const byPage = new Map<number, string[]>();
  for (const img of images) {
    const arr = byPage.get(img.pageNumber) ?? [];
    arr.push(img.image);
    byPage.set(img.pageNumber, arr);
  }

  const items: Array<{
    pageNumber: number;
    kind: 'text' | 'image';
    embedding: number[];
    imageIndex?: number;
  }> = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p);

    // TEXT
    const text = await extractPageText(page);
    if (text) {
      const t = await computeTextEmbedding(text);
      const v = Array.from(t.dataSync ? (t.dataSync() as Float32Array) : (t as any));
      items.push({ pageNumber: p, kind: 'text', embedding: v });
    }

    // IMAGES
    let i = 0;
    for (const base64 of byPage.get(p) ?? []) {
      const e = await computeImageEmbedding(base64);
      const v = Array.from(e.dataSync ? (e.dataSync() as Float32Array) : (e as any));
      items.push({ pageNumber: p, kind: 'image', imageIndex: i++, embedding: v });
    }
  }

  return { numPages, items };
}
