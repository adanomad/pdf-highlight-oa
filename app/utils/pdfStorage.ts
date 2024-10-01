import { StoredPdf } from "./types";
import SQLiteDatabasePdf from "./sqliteUtilsPdf";
class PdfStorage {
  private db: SQLiteDatabasePdf;

  constructor() {
    this.db = new SQLiteDatabasePdf();
  }

  async savePdf(pdf: StoredPdf): Promise<void> {
    // if (!pdf.content) {
    //   pdf.content = ""; // or some default value
    // }
    await this.db.savePdf(pdf);
  }

  // async saveBulkHighlights(pdfs: StoredPdf[]): Promise<void> {
  //   const validPdfs = pdfs.map((pdf) => ({
  //     ...highlight,
  //     keyword: highlight.keyword || "", // or some default value
  //   }));
  //   await this.db.saveBulkHighlights(validHighlights);
  // }

  async getPdf(id: string): Promise<StoredPdf[]> {
    //console.log("id: ", id);
    return await this.db.getPdfById(id);
  }

  async deletePdf(id: string): Promise<void> {
    await this.db.deletePdf(id);
  }

  // async indexWords(
  //   pdfId: string,
  //   words: {
  //     keyword: string;
  //     x1: number;
  //     y1: number;
  //     x2: number;
  //     y2: number;
  //   }[]
  // ): Promise<void> {
  //   const storedHighlights = words.map((word) => ({
  //     ...word,
  //     id: Math.random().toString(36).substr(2, 9),
  //     pdfId,
  //     width: 0,
  //     height: 0,
  //     pageNumber: -1,
  //     text: "",
  //     image: undefined,
  //   }));
  //   await this.saveBulkHighlights(storedHighlights);
  // }

  async close(): Promise<void> {
    await this.db.close();
  }

}
export default PdfStorage;
