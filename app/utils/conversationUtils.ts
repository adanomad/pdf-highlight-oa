import sqlite3 from "sqlite3";
import path from "path";

export interface Conversation {
  id: string;
  pdfId: string;
  pdfName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

class ConversationDatabase {
  private db: sqlite3.Database;
  private migrationPromise: Promise<void>;

  constructor() {
    this.db = new sqlite3.Database(
      path.join(process.cwd(), "conversations.db"),
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (error) => {
        if (error) {
          console.error("Error opening conversations database:", error.message);
        } else {
          console.log("Connected to conversations db!");
        }
      }
    );
    this.migrationPromise = this.migrate();
  }

  private async migrate(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create conversations table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            pdfId TEXT NOT NULL,
            pdfName TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `);

        // Create messages table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversationId TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (conversationId) REFERENCES conversations(id)
          )
        `);

        resolve();
      });
    });
  }

  async createConversation(pdfId: string, pdfName: string): Promise<Conversation> {
    await this.migrationPromise;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO conversations (id, pdfId, pdfName, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, pdfId, pdfName, now, now],
        (err) => {
          if (err) reject(err);
          else resolve({ id, pdfId, pdfName, createdAt: now, updatedAt: now });
        }
      );
    });
  }

  async getConversations(): Promise<Conversation[]> {
    await this.migrationPromise;
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM conversations ORDER BY updatedAt DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Conversation[]);
        }
      );
    });
  }

  async getConversation(id: string): Promise<Conversation | null> {
    await this.migrationPromise;
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM conversations WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Conversation || null);
        }
      );
    });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    await this.migrationPromise;
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC`,
        [conversationId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Message[]);
        }
      );
    });
  }

  async addMessage(conversationId: string, role: "user" | "assistant", content: string): Promise<Message> {
    await this.migrationPromise;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO messages (id, conversationId, role, content, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, conversationId, role, content, now],
        (err) => {
          if (err) reject(err);
          else {
            // Update conversation's updatedAt timestamp
            this.db.run(
              `UPDATE conversations SET updatedAt = ? WHERE id = ?`,
              [now, conversationId],
              (err) => {
                if (err) reject(err);
                else resolve({ id, conversationId, role, content, createdAt: now });
              }
            );
          }
        }
      );
    });
  }
}

export const conversationDb = new ConversationDatabase(); 