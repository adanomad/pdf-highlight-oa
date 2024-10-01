// app/utils/highlightStorage.ts
// Bonus challenge.

import { StoredHighlight } from "./types";
import { HighlightsSQLiteDatabase } from "./sqliteUtils";

// TODO: Import necessary types and libraries
// Consider importing types from your PDF highlighting library
// import { IHighlight } from "react-pdf-highlighter";

// TODO: Import a database library (e.g., SQLite, Postgres, or a Key-Value Store)
// import { Database } from "your-chosen-database-library";

// TODO: Define an interface for the highlight data we want to store
// interface StoredHighlight {
//   id: string;
//   pdfId: string;
//   pageNumber: number;
//   x1: number;
//   y1: number;
//   x2: number;
//   y2: number;
//   width: number;
//   height: number;
//   text: string;
//   keyword: string;
// }

// TODO: Define a class to handle highlight storage operations

class HighlightStorage {
  private db: HighlightsSQLiteDatabase;

  constructor() {
    this.db = new HighlightsSQLiteDatabase();
  }

  async saveHighlight(highlight: StoredHighlight): Promise<void> {
    if (!highlight.keyword) {
      highlight.keyword = ""; // or some default value
    }
    await this.db.saveHighlight(highlight);
  }

  async saveBulkHighlights(highlights: StoredHighlight[]): Promise<void> {
    const validHighlights = highlights.map((highlight) => ({
      ...highlight,
      keyword: highlight.keyword || "", // or some default value
    }));
    await this.db.saveBulkHighlights(validHighlights);
  }

  async getHighlightsForPdf(pdfId: string): Promise<StoredHighlight[]> {
    return await this.db.getHighlightsForPdf(pdfId);
  }

  async deleteHighlight(pdfId: string, id: string): Promise<void> {
    await this.db.deleteHighlight(pdfId, id);
  }

  async indexWords(
    pdfId: string,
    words: {
      keyword: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[]
  ): Promise<void> {
    const storedHighlights = words.map((word) => ({
      ...word,
      id: Math.random().toString(36).substr(2, 9),
      pdfId,
      width: 0,
      height: 0,
      pageNumber: -1,
      text: "",
      image: undefined,
    }));
    await this.saveBulkHighlights(storedHighlights);
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  // TODO: Implement updateHighlight method
  // async updateHighlight(id: string, updatedData: Partial<StoredHighlight>): Promise<void> {
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

// Export the HighlightStorage class for use in other parts of the application
export default HighlightStorage;

// FINAL CHALLENGE: Consider how you would scale this solution for large numbers of PDFs and highlights
// Think about indexing, partitioning, and potential cloud-based solutions
