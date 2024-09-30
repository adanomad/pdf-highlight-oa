// app/utils/pdfStorage.ts

import { StoredPdf } from "./types";
import BaseStorage from "./baseStorage";

class PdfStorage extends BaseStorage {

  async storePdf(pdf: StoredPdf): Promise<void> {
    await this.db.savePdf(pdf);
  }

  async getPdf(pdfId?: string): Promise<StoredPdf[]> {
    return await this.db.getPdf(pdfId);
  }
}

// Export the PdfStorage class for use in other parts of the application
export default PdfStorage;