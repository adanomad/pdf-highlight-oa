// app/utils/pdfStorage.ts

import { StoredPdf } from "./types";
import { PdfSQLiteDatabase } from "./sqliteUtils";

// This follows closely the structure of the existing highlightStorage class
class pdfStorage {
  private db: PdfSQLiteDatabase;

  constructor() {
    this.db = new PdfSQLiteDatabase();
  }

  async savePdf(pdf: StoredPdf): Promise<void> {
    if (pdf.id) {
      await this.db.savePdf(pdf);
    }
  }

  async deletePdf(id: string): Promise<void> {
    await this.db.deletePdf(id);
  }

  async getPdf(id: string): Promise<StoredPdf> {
    return await this.db.getPdf(id);
  }

  async getBulkPdf(amount: number): Promise<StoredPdf[]> {
    return await this.db.getBulkPdf(amount);
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

export default pdfStorage;
