// app/utils/sqliteUtils.ts
import sqlite3 from "sqlite3";
import * as sqliteVec from "sqlite-vec";
import Database from "better-sqlite3";
import path from "path";
import { StoredPdf, PdfLocation, StoredHighlight, SearchResult } from "./types";

class SQLiteDatabase {
  private db: sqlite3.Database;
  private vecDb: Database.Database;
  private migrationPromise: Promise<void>;
  private vecMigrationPromise:Promise<void>;

  constructor() {
    this.db = new sqlite3.Database(
      path.join(process.cwd(), "pdfs.db"),
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (error) => {
        if (error) {
          console.error("Error opening database:", error.message);
        } else {
          console.log("Connected to pdfs db!");
        }
      }
    );
    this.vecDb = new Database("vecPdfs.db");
    sqliteVec.load(this.vecDb);
    this.migrationPromise = this.migrate();
    this.vecMigrationPromise = this.vecMigrate();
  }

  private migrate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS pdfs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          numPages INTEGER NOT NULL,
          url TEXT NOT NULL
        );
      `;
      const highlightSql = `
        CREATE TABLE IF NOT EXISTS pdfs_highlight (
          id NUMBER PRIMARY KEY,
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
          keyword TEXT
        )
      `;
      this.db.run(sql, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
          reject(err);
        } else {
          resolve();
        }
      });
      this.db.run(highlightSql, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private vecMigrate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sqlCreate = this.vecDb.prepare(`
        CREATE VIRTUAL TABLE IF NOT EXISTS pdfs_virtual 
        USING vec0(
          id INT PRIMARY KEY,
          embedding FLOAT32[512],
          isImage INT NOT NULL,
        );`)

      const sql = this.vecDb.prepare(`
        CREATE TABLE IF NOT EXISTS pdfs_vec (
          vec_id INTEGER PRIMARY KEY,
          pdfId TEXT NOT NULL,
          pageNumber INTEGER NOT NULL,
          lineNumber INTEGER NOT NULL,
          UNIQUE (pdfId, pageNumber, lineNumber)
        );
      `);
      try {
        sql.run();
        sqlCreate.run();
        console.log("Created database tables if not already present.");
        resolve();
      } catch(err) {
        if (err) {
          console.error("Error creating table:", err);
          reject(err);
        } else {
          console.log("Error with SQL database for vectors.");
        }
      };
    })
  }

  private async ensureMigrated(): Promise<void> {
    await this.migrationPromise;
  }

  private async vecEnsureMigrated(): Promise<void> {
    await this.vecMigrationPromise;
  }

   async saveHighlight(id: number, highlight: StoredHighlight): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO pdfs_highlight (id, pdfId, pageNumber, x1, y1, x2, y2, width, height, text, image, keyword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      const { 
        pdfId,
        pageNumber, 
        x1, 
        y1, 
        x2, 
        y2, 
        width, 
        height, 
        text,
        image,
        keyword 
      } = highlight;
      const arr = [
        id,
        pdfId,
        pageNumber, 
        x1, 
        y1, 
        x2, 
        y2, 
        width, 
        height, 
        text,
        image ? image : "",
        keyword
      ];
      this.db.run(sql, arr, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async getHighlightsForPdf(pdfId: string): Promise<StoredHighlight[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM pdfs_highlight WHERE pdfId = ?`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [pdfId], (error, rows) => {
        if (error) reject(error);
        else resolve(rows as StoredHighlight[]);
      });
    });
  }

  async getHighlightsFromId(id: number): Promise<StoredHighlight[]> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM pdfs_highlight WHERE id = CAST(? AS INTEGER)`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (error, rows: any) => {
        if (error) reject(error);
        else {
          const { 
            pdfId,
            pageNumber, 
            x1, 
            y1, 
            x2, 
            y2, 
            width, 
            height, 
            text,
            image,
            keyword 
          } = rows;
          const highlight = {
            pdfId,
            pageNumber, 
            x1, 
            y1, 
            x2, 
            y2, 
            width, 
            height, 
            text,
            image,
            keyword 
          } as StoredHighlight;
          resolve([highlight]);
        } 
      });
    });
  }

  async deleteHighlight(pdfId: string, id: string): Promise<void> {
    await this.ensureMigrated();
    const sql = `DELETE FROM pdfs_highlight WHERE pdfId = ? AND id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [pdfId, id], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async savePdf(file: StoredPdf): Promise<void> {
    await this.ensureMigrated();
    const sql = `INSERT OR REPLACE INTO pdfs (id, name, numPages, url) VALUES (?, ?, ?, ?)`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [file.id, file.name, file.numPages, file.url], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async getPdf(id: string): Promise<StoredPdf> {
    await this.ensureMigrated();
    const sql = `SELECT * FROM pdfs WHERE id = ?`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (error, rowsObj: any) => {
        if (error) {
          reject(error);
        } else {
          const pdf = rowsObj as StoredPdf;
          resolve(pdf);
        }
      });
    });
  }

  async getAllPdfs(): Promise<StoredPdf[]> {
      await this.ensureMigrated();
      const sql = `SELECT * FROM pdfs`;
      return new Promise((resolve, reject) => {
        this.db.all(sql, (error, rows) => {
          if (error) reject(error);
          else resolve(rows as StoredPdf[]);
        });
      });
    }

  async deletePdf(id: string): Promise<void> {
    await this.ensureMigrated();
    const sql = `DELETE FROM pdfs WHERE id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }    

  async saveEmbeddings(pdfId: string, embedding: any, pageNumber: number, lineNumber: number): Promise<number> {
    await this.vecEnsureMigrated();
    const alreadyThere = this.vecDb.prepare(`
      SELECT COUNT(*)
        FROM pdfs_vec 
        WHERE pdfId = ? AND pageNumber = CAST(? AS INTEGER) AND lineNumber = CAST(? AS INTEGER);
    `);

    const getVecId = this.vecDb.prepare(`
      SELECT vec_id 
        FROM pdfs_vec 
        WHERE pdfId = ? AND pageNumber = CAST(? AS INTEGER) AND lineNumber = CAST(? AS INTEGER);
    `);

    const sql = this.vecDb.prepare(`
      INSERT OR REPLACE
        INTO pdfs_vec 
        (pdfId, pageNumber, lineNumber) 
        VALUES 
        (?, CAST(? AS INTEGER), CAST(? AS INTEGER));
    `);

    const sqlVirtualTable = this.vecDb.prepare(`
      INSERT OR REPLACE
        INTO pdfs_virtual 
        (id, embedding, isImage) 
        VALUES 
        (CAST(? AS INTEGER), ?, CAST(? AS INTEGER));
    `);

    return new Promise((resolve, reject) => {
        try {      
          const insertEmbeddings = this.vecDb.transaction((pdfId, embedding, pageNumber, lineNumber?) => {
            const countAlrThere: any = alreadyThere.get(pdfId, pageNumber, lineNumber);
            const isAlrThere = countAlrThere['COUNT(*)'] !== 0;

            if (!isAlrThere) {
              sql.run(
                pdfId,
                pageNumber,
                lineNumber
              );
            }

            const idObj: any = getVecId.get(pdfId, pageNumber, lineNumber);
            const { vec_id } = idObj;

            if (!isAlrThere) {
              sqlVirtualTable.run(vec_id, embedding, lineNumber < 0 ? 1 : 0);
              console.log(`Uploaded embeddings for page ${pageNumber}${lineNumber > 0 ? " line " + lineNumber : ""} of PDF.`);
            }
              
            resolve(vec_id);
          })
          insertEmbeddings(pdfId, embedding, pageNumber, lineNumber);
        } catch(err) {
          if  (err) {
            console.error("Error uploading embeddings:", err);
            reject(err);
          } else {
          console.log("Error uploading embeddings.");
            reject();
          }
        };
      })
  }

  async search(queryEmbedding: any): Promise<SearchResult[]> {
    const sql = this.vecDb.prepare(`
        SELECT
            pdfId,
            pageNumber,
            lineNumber
          FROM pdfs_vec
          WHERE vec_id = ?;
        `);
      const sqlManualSearch = this.vecDb.prepare(`
        SELECT
            id,
            vec_distance_l2(?, embedding) - ? * isImage AS distance
          FROM pdfs_virtual
          ORDER BY distance ASC
          LIMIT ?;
        `);
     const getResults = async () => {
        try {
          //The embedding model heavily considers text to be more similar than images
          //so IMG_BIAS is used to balance the results
          const IMG_BIAS = 7.1; 
          const SEARCH_LIMIT = 30;

          const getPdfInfo = async (resArr: any[]) => {
            let results: SearchResult[] = new Array(resArr.length);
            for (let i = 0; i < resArr.length; ++i) {
              const pageObj: any = resArr[i];
              if (pageObj !== null) {
                const { distance, id } = pageObj;
                const infoObj: any = sql.get(id);
                const { pdfId, pageNumber, lineNumber } = infoObj;
                const page = await this.getPdf(pdfId);
                const pp: PdfLocation = { pdf: page, pageNumber, lineNumber}
                const result = {id, pdfPage: pp, distance };
                results[i] = result;
              }
            }
            return results;
          }
          const manualArr = sqlManualSearch.all(queryEmbedding, IMG_BIAS, SEARCH_LIMIT);
          const manualResults: SearchResult[] = await getPdfInfo(manualArr);
          return manualResults;

        } catch(err) {
            console.error("Error with search:", err);
            throw (err);
        };
      }
      return await getResults(); 
  }

  async close(): Promise<void> {
    await this.ensureMigrated();
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) reject(error);
        else resolve();
      });
      this.vecDb.close();
    });
  }
}

export default SQLiteDatabase;
