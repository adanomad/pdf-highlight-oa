// app/utils/embeddingStorage.ts

import sqlite3 from "sqlite3"
import path from "path";
import { StoredEmbedding } from "./types";
import { embedText } from "./embedding";

function euclideanDistance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, ai, i) => sum + Math.pow(ai - b[i], 2), 0));
}

class EmbeddingDatabase {
  private db: sqlite3.Database;
  private tableName: string = "pages";

  private migrationPromise: Promise<void>;
  
  constructor() {
    this.db = new sqlite3.Database(
      path.join(process.cwd(), "embeddings.db"),
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (error) => {
        if (error) {
          console.error("Error opening database:", error.message);
        } else {
          console.log("Connected to embeddings db!");
        }
      }
    );
    this.migrationPromise = this.migrate();
  }

  private migrate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE ${this.tableName} (
          id UUID PRIMARY KEY,
          pdfId INT,
          pageNum INT,
          text TEXT,
          embedding VECTOR(1536)
        );
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

  async saveEmbedding(embedding: StoredEmbedding): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, pdfId, pageNum, text, embedding) VALUES (?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, Object.values(embedding), (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async saveBulkEmbedding(embeddings: StoredEmbedding[]): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, pdfId, pageNum, text, embedding) VALUES (?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        const stmt = this.db.prepare(sql);
        embeddings.forEach((embedding) => {
          stmt.run(Object.values(embedding));
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

  async getEmbeddingForPDF(pdfId: string): Promise<StoredEmbedding[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM ${this.tableName} WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [pdfId], (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredEmbedding[]);
      });
    });
  }

  async searchEmbedding(query: string) {
    const embedding = await embedText(query);

    await this.ensureMigrated();
    const sql = `
      SELECT *
        FROM pages
    `;

    const res: StoredEmbedding[] = await new Promise((resolve, reject) => {
      this.db.all(sql, [], (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredEmbedding[]);
      });
    });

    return res.map(r => ({
      ...r,
      distance: euclideanDistance(r.embedding, embedding)
    }))
    .sort((a, b) => a.distance - b.distance);
  }

  async deleteEmbedding(pdfId: string, id: string): Promise<void> {
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

export default EmbeddingDatabase;