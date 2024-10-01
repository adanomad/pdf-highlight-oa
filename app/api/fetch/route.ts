import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { PDFDocument } from 'pdf-lib';

async function openDatabase() {
  return open({
    filename: './database/documents.db',
    driver: sqlite3.Database,
  });
}

export async function GET() {
  const db = await openDatabase();

  try {
    const rows = await db.all('SELECT filename, filedata FROM "PDF Files"');
    console.log(rows.length);

    if (rows.length === 0) {
      return NextResponse.json(null, { status: 404 });
    }

    const mergedPdf = await PDFDocument.create();
    const filenames = [];
    const startPageNumbers = [];

    let currentPageCount = 0;

    for (const row of rows) {
      const pdf = await PDFDocument.load(row.filedata);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));

      filenames.push(row.filename);
      startPageNumbers.push(currentPageCount + 1);
      currentPageCount += pdf.getPageCount();
    }

    const mergedPdfBytes = await mergedPdf.save();

    const response = new Response(mergedPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="merged-document.pdf"',
        'Content-Length': mergedPdfBytes.length,
        'X-Filenames': JSON.stringify(filenames),
        'X-Start-Pages': JSON.stringify(startPageNumbers),
      },
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(null, { status: 500 });
  } finally {
    await db.close();
  }
}
