import sqlite3 from "sqlite3";

// Define a type for the PDF entry
interface StoredPDF {
  pdfId: string;
  fileName: string;
  data: Buffer;
}

class PDFStorage {
  private db: sqlite3.Database;
  private pdfTableName: string = "pdfs";

  constructor() {
    this.db = new sqlite3.Database("highlights.db"); // Replace with your database file path
    this.initializeTable();
  }

  // Initialize the table if it doesn't exist
  private initializeTable(): void {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.pdfTableName} (
        pdfId TEXT PRIMARY KEY,
        fileName TEXT,
        data BLOB
      )
    `;
    this.db.run(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating PDF table:", err.message);
      }
    });
  }

  // Save a single PDF entry
  async savePDF(pdf: StoredPDF): Promise<void> {
    const pdfData = Buffer.from(pdf.data);

    const insertQuery = `
      INSERT INTO ${this.pdfTableName} (pdfId, fileName, data) 
      VALUES (?, ?, ?)
    `;
    return new Promise((resolve, reject) => {
      this.db.run(insertQuery, [pdf.pdfId, pdf.fileName, pdfData], (err) => {
        if (err) {
          reject("Error saving PDF entry: " + err.message);
        } else {
          resolve();
        }
      });
    });
  }

  // Save multiple PDF entries in bulk
  async saveBulkPDFs(pdfs: StoredPDF[]): Promise<void> {
    const insertQuery = `
      INSERT INTO ${this.pdfTableName} (pdfId, fileName, data) 
      VALUES (?, ?, ?)
    `;
    const stmt = this.db.prepare(insertQuery);
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        for (const pdf of pdfs) {
          stmt.run([pdf.pdfId, pdf.fileName, pdf.data], (err) => {
            if (err) {
              reject("Error saving bulk PDF entries: " + err.message);
            }
          });
        }
        stmt.finalize((err) => {
          if (err) {
            reject("Error finalizing bulk insert: " + err.message);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // Retrieve a PDF entry by its ID
  async getPdf(
    pdfId: string
  ): Promise<{ fileName: string; data: Buffer } | null> {
    const selectQuery = `SELECT fileName, data FROM ${this.pdfTableName} WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.get(
        selectQuery,
        [pdfId],
        (err, row: { fileName: string; data: Buffer }) => {
          if (err) {
            reject("Error fetching PDF entry: " + err.message);
          } else {
            if (row) {
              resolve({ fileName: row.fileName, data: row.data });
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  // Delete a PDF entry by its ID
  async deletePDF(pdfId: string): Promise<void> {
    const deleteQuery = `DELETE FROM ${this.pdfTableName} WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(deleteQuery, [pdfId], (err) => {
        if (err) {
          reject("Error deleting PDF entry: " + err.message);
        } else {
          resolve();
        }
      });
    });
  }

  // Close the database connection
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject("Error closing database: " + err.message);
        } else {
          resolve();
        }
      });
    });
  }
}

export default PDFStorage;
