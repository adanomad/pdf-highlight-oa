// app/utils/sqliteUtils.ts

import sqlite3 from "sqlite3";
import path from "path";
import { StoredPdf } from "./types";

class SQLiteDatabasePdf {
  private db: sqlite3.Database;
  private tableName: string = "pdf";
  private migrationPromise: Promise<void>;

  constructor() {
    this.db = new sqlite3.Database(
      path.join(process.cwd(), "database.db"),
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (error: unknown) => {
        if (error) {
          console.error("Error opening database:", error);
        } else {
          console.log("Connected to pdf db!");
        }
      }
    );
    this.migrationPromise = this.migrate();
  }

  private migrate(): Promise<void> {//creating a new 
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS ${this.tableName}
          (id TEXT PRIMARY KEY, content TEXT)
      `;
      this.db.run(sql, (err: unknown) => {
        if (err) {
          console.error("Error creating table:", err);
          reject(err);
        } else {
          console.log("Pdf table created or already exists");
          resolve();
        }
      });
    });
  }

  private async ensureMigrated(): Promise<void> {
    await this.migrationPromise;
  }

  async savePdf(pdf: StoredPdf): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, content) VALUES (?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, Object.values(pdf), (error: unknown) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async saveBulkPdfs(pdfs: StoredPdf[]): Promise<void> {
    //for future use, if we want to save multiple pdfs
  }

  async getPdfById(id: string): Promise<StoredPdf[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    //console.log("id: ", id);
    return new Promise((resolve, reject) => {
      this.db.all(sql, [id], (error: unknown, rows: unknown) => {
        if (error) reject(error);
        else resolve(rows as StoredPdf[]);
      });
    });
  }

  async deletePdf(id: string): Promise<void> {
    await this.ensureMigrated();
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], (error: unknown) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    await this.ensureMigrated();
    return new Promise((resolve, reject) => {
      this.db.close((error: unknown) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

export default SQLiteDatabasePdf;
