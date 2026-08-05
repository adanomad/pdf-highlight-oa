// app/utils/PdfStorage.ts
// Bonus challenge.

import sqlite3 from "sqlite3";
import path from "path";
import { StoredPdf } from "./types";
import SQLiteDatabase from "./sqliteUtils";

// TODO: Import necessary types and libraries
// Consider importing types from your PDF highlighting library
// import { IHighlight } from "react-pdf-highlighter";

// TODO: Import a database library (e.g., SQLite, Postgres, or a Key-Value Store)
// import { Database } from "your-chosen-database-library";

// TODO: Define an interface for the highlight data we want to store
// interface StoredPdf {
//   id: string;
//   name: string;
//   file: Blob;
// }

// TODO: Define a class to handle highlight storage operations

class PdfStorage {
  private db: sqlite3.Database;
  private tableName: string = "pdfs";
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
      const sql = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          numPages INTEGER NOT NULL,
          file BLOB NOT NULL
        )
      `;
      this.db.run(sql, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
          reject(err);
        } else {
          console.log("Pdfs table created or already exists");
          resolve();
        }
      });
    });
  }

  private async ensureMigrated(): Promise<void> {
    await this.migrationPromise;
  }

  async savePdf(file: StoredPdf): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, name, numPages, file) VALUES (?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      if (!file) {
        console.log("Error: file returned is null");
      }
      this.db.run(sql, Object.values(file), (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async saveBulkPdfs(files: StoredPdf[]): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, name, numPages, file) VALUES (?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        const stmt = this.db.prepare(sql);
        files.forEach((file) => {
          stmt.run(Object.values(file));
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

  async getPdf(pdfId: string): Promise<StoredPdf[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM ${this.tableName} WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [pdfId], (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredPdf[]);
      });
    });
  }

  async getAllPdfs(): Promise<StoredPdf[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM ${this.tableName}`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredPdf[]);
      });
    });
  }

  async deletePdf(id: string): Promise<void> {
    await this.ensureMigrated();
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
/*
  async indexWords(
    id: string,
    words: {
      keyword: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[]
  ): Promise<void> {
    const StoredPdfs = words.map((word) => ({
      ...word,
      id: Math.random().toString(36).substr(2, 9),
      pdfId,
      width: 0,
      height: 0,
      pageNumber: -1,
      text: "",
      image: undefined,
    }));
    await this.saveBulkPdfs(StoredPdfs);
  }*/

    async close(): Promise<void> {
    await this.ensureMigrated();
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  // TODO: Implement updateHighlight method
  // async updateHighlight(id: string, updatedData: Partial<StoredPdf>): Promise<void> {
  //   // Implement update logic
  // }

  // BONUS CHALLENGE: Implement export/import methods
  // async exportToJson(pdfId: string, filePath: string): Promise<void> {
  //   // Implement export logic
  // }

  // async importFromJson(filePath: string): Promise<void> {
  //   // Implement import logic
  // }
}

// TODO: Consider implementing a caching layer for frequently accessed highlights
// CHALLENGE: Design a caching strategy that balances performance and memory usage

// TODO: Implement error handling and logging throughout the class

// BONUS CHALLENGE: Implement a method to export highlights to a JSON file
// async exportToJson(pdfId: string, filePath: string): Promise<void> {
//   // Retrieve highlights and write to a JSON file
// }

// BONUS CHALLENGE: Implement a method to import highlights from a JSON file
// async importFromJson(filePath: string): Promise<void> {
//   // Read from JSON file and insert highlights into the database
// }

// Export the PdfStorage class for use in other parts of the application
export default PdfStorage;

// FINAL CHALLENGE: Consider how you would scale this solution for large numbers of PDFs and highlights
// Think about indexing, partitioning, and potential cloud-based solutions
