import { PDFDocument } from 'pdf-lib';
import SQLiteDatabase from './sqliteUtils';
import * as Tesseract from 'tesseract.js';
import { writeFileSync } from 'fs';       
import path from 'path';                  

const db = new SQLiteDatabase();

async function runOCR(imageBuffer: Buffer): Promise<string> {
  const result = await Tesseract.recognize(imageBuffer, 'eng');
  return result.data.text;
}

export async function processPdfIntoPages(pdfId: string) {
  try {
    const pdfRow = await new Promise<{ data: Buffer }>((resolve, reject) => {
      db['db'].get(
        'SELECT data FROM pdfs WHERE id = ?',
        [pdfId],
        (err: Error | null, row: any) => {
          if (err) reject(err);
          else if (!row || !row.data) reject(new Error('No PDF found.'));
          else resolve({ data: row.data });
        }
      );
    });

    const pdfDoc = await PDFDocument.load(pdfRow.data);
    const pages = pdfDoc.getPages();

    console.log(`Loaded PDF: ${pages.length} page(s)`);

    for (let i = 0; i < pages.length; i++) {
    console.log(`Processing page ${i + 1}...`);

    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
    newDoc.addPage(copiedPage); 

    const pageBuffer = await newDoc.save();

    const extractedText = await runOCR(Buffer.from(pageBuffer));
    console.log(`Extracted text from page ${i + 1}:\n${extractedText}`);
  }

  } catch (error) {
    console.error(`Error loading or processing PDF:`, error);
  }
}
