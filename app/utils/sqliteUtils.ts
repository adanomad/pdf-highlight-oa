// app/utils/sqliteUtils.ts

import sqlite3 from "sqlite3";
import path from "path";
import { StoredHighlight } from "./types";

class SQLiteDatabase {
  private db: sqlite3.Database;
  private tableName: string = "highlights";
  private migrationPromise: Promise<void>;

  constructor() {
    this.db = new sqlite3.Database(
      path.join(process.cwd(), "database.db"),
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
      const sql = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
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
      this.db.run(sql, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
          reject(err);
        } else {
          console.log("Highlights table created or already exists");
          resolve();
        }
      });
    });
  }

  private async ensureMigrated(): Promise<void> {
    await this.migrationPromise;
  }

  async saveHighlight(highlight: StoredHighlight): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, pdfId, pageNumber, x1, y1, x2, y2, width, height, text, image, keyword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, Object.values(highlight), (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async saveBulkHighlights(highlights: StoredHighlight[]): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, pdfId, pageNumber, x1, y1, x2, y2, width, height, text, image, keyword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
    const sql = `SELECT * FROM ${this.tableName} WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [pdfId], (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredHighlight[]);
      });
    });
  }

  async deleteHighlight(pdfId: string, id: string): Promise<void> {
    await this.ensureMigrated();
    const sql = `DELETE FROM ${this.tableName} WHERE pdfId = ? AND id = ?`;
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
