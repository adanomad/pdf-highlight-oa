import PDFStorage from "../../../utils/pdfStorage";

async function handlePdfRequest(
  req: Request,
  action: (body: any, db?: PDFStorage) => Promise<void>
): Promise<Response> {
  let db: PDFStorage | undefined;
  try {
    const body = await req.json();
    db = new PDFStorage();
    await action(body, db);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 500 });
  } finally {
    if (db) {
      await db.close();
    }
  }
}

async function savePdf(body: any, db?: PDFStorage): Promise<void> {
  if (db) {
    if (Array.isArray(body.pdfs)) {
      await db.saveBulkPDFs(body.pdfs);
    } else {
      await db.savePDF(body);
    }
  } else {
    // Handle alternative storage, if necessary
  }
}

export async function POST(req: Request): Promise<Response> {
  return handlePdfRequest(req, savePdf);
}

export async function DELETE(req: Request): Promise<Response> {
  const { pdfId } = await req.json();
  return handlePdfRequest(req, async (_, db) => {
    if (db) {
      await db.deletePDF(pdfId);
    }
  });
}
