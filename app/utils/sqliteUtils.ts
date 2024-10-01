// app/utils/sqliteUtils.ts

import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs"; // Import fs to handle file system operations
import { StoredHighlight } from "./types";

class SQLiteDatabase {
  private db: sqlite3.Database;
  private highlightTableName: string = "highlights";
  private pdfTableName: string = "pdfs"; // New table for storing PDFs
  private migrationPromise: Promise<void>;

  constructor() {
    this.db = new sqlite3.Database(
      path.join(process.cwd(), "highlights.db"),
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (error) => {
        if (error) {
          console.error("Error opening database:", error.message);
        } else {
          console.log("Connected to highlights db!");
        }
      }
    );
    this.migrationPromise = this.migrate();
  }

  private migrate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createHighlightTableSQL = `
        CREATE TABLE IF NOT EXISTS ${this.highlightTableName} (
          id TEXT,
          pdfId TEXT,
          pageNumber INTEGER NOT NULL,
          x1 REAL NOT NULL,
          y1 REAL NOT NULL,
          x2 REAL NOT NULL,
          y2 REAL NOT NULL,
          width REAL,
          height REAL,
          text TEXT,
          image TEXT,
          keyword TEXT,
          PRIMARY KEY (id, pdfId)
        )
      `;

      const createPdfTableSQL = `
        CREATE TABLE IF NOT EXISTS ${this.pdfTableName} (
          pdfId TEXT PRIMARY KEY,
          fileName TEXT,
          data BLOB
        )
      `;

      this.db.serialize(() => {
        this.db.run(createHighlightTableSQL, (err) => {
          if (err) {
            console.error("Error creating highlights table:", err.message);
            reject(err);
          } else {
            console.log("Highlights table created or already exists");
          }
        });

        this.db.run(createPdfTableSQL, (err) => {
          if (err) {
            console.error("Error creating pdfs table:", err.message);
            reject(err);
          } else {
            console.log("PDFs table created or already exists");
            resolve();
          }
        });
      });
    });
  }

  private async ensureMigrated(): Promise<void> {
    await this.migrationPromise;
  }

  // New method to save PDF file to the database
  async savePdf(pdfId: string, filePath: string): Promise<void> {
    await this.ensureMigrated();

    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath); // Read file data as binary

    const sql = `INSERT OR REPLACE INTO ${this.pdfTableName} (pdfId, fileName, data) VALUES (?, ?, ?)`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [pdfId, fileName, fileData], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  // New method to retrieve a PDF file from the database
  async getPdf(
    pdfId: string
  ): Promise<{ fileName: string; data: Buffer } | null> {
    await this.ensureMigrated();

    const sql = `SELECT fileName, data FROM ${this.pdfTableName} WHERE pdfId = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(
        sql,
        [pdfId],
        (error, row: { fileName: string; data: Buffer }) => {
          if (error) {
            reject(error);
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

  // New method to delete a PDF file from the database
  async deletePdf(pdfId: string): Promise<void> {
    await this.ensureMigrated();

    const sql = `DELETE FROM ${this.pdfTableName} WHERE pdfId = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [pdfId], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  // Existing methods for highlight operations remain unchanged...

  async saveHighlight(highlight: StoredHighlight): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.highlightTableName} (id, pdfId, pageNumber, x1, y1, x2, y2, width, height, text, image, keyword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, Object.values(highlight), (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async saveBulkHighlights(highlights: StoredHighlight[]): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.highlightTableName} (id, pdfId, pageNumber, x1, y1, x2, y2, width, height, text, image, keyword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        const stmt = this.db.prepare(sql);
        highlights.forEach((highlight) => {
          stmt.run(Object.values(highlight));
        });
        stmt.finalize((error) => {
          if (error) {
            this.db.run("ROLLBACK");
            reject(error);
          } else {
            this.db.run("COMMIT", (commitError) => {
              if (commitError) reject(commitError);
              else resolve();
            });
          }
        });
      });
    });
  }

  async getHighlightsForPdf(pdfId: string): Promise<StoredHighlight[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM ${this.highlightTableName} WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [pdfId], (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredHighlight[]);
      });
    });
  }

  async deleteHighlight(pdfId: string, id: string): Promise<void> {
    await this.ensureMigrated();
    const sql = `DELETE FROM ${this.highlightTableName} WHERE pdfId = ? AND id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [pdfId, id], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    await this.ensureMigrated();
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

export default SQLiteDatabase;
