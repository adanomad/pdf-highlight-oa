// app/utils/highlightStorage.ts
// Bonus challenge.

// TODO: Import necessary types and libraries
// Consider importing types from your PDF highlighting library
// import { IHighlight } from "react-pdf-highlighter";

// TODO: Import a database library (e.g., SQLite, Postgres, or a Key-Value Store)
// import { Database } from "your-chosen-database-library";

// TODO: Define an interface for the highlight data we want to store
interface StoredHighlight {
  id: string;
  pdfId: string;
  pageNumber: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  keyword: string;
}

// TODO: Define a class to handle highlight storage operations
class HighlightStorage {
  private db: any; // Replace 'any' with the actual type from your chosen database library

  constructor() {
    // TODO: Initialize the database connection
    // this.db = new Database(/* connection details */);
  }

  // TODO: Implement a method to save a single highlight
  async saveHighlight(highlight: StoredHighlight): Promise<void> {
    // CHALLENGE: Implement the logic to save a highlight to the database
    // Consider using prepared statements or an ORM to prevent SQL injection
    // Example pseudo-code:
    // await this.db.insert("highlights", highlight);
  }

  // TODO: Implement a method to save multiple highlights in bulk
  async saveBulkHighlights(highlights: StoredHighlight[]): Promise<void> {
    // CHALLENGE: Implement bulk insert logic
    // Consider using transactions for better performance and data integrity
  }

  // TODO: Implement a method to retrieve highlights for a specific PDF
  async getHighlightsForPdf(pdfId: string): Promise<StoredHighlight[]> {
    // CHALLENGE: Implement the logic to retrieve highlights from the database
    // Example pseudo-code:
    // return await this.db.query("SELECT * FROM highlights WHERE pdfId = ?", [pdfId]);
    return [];
  }

  // TODO: Implement a method to update an existing highlight
  async updateHighlight(
    id: string,
    updatedData: Partial<StoredHighlight>
  ): Promise<void> {
    // CHALLENGE: Implement the update logic
    // Consider which fields should be updatable and which should remain constant
  }

  // TODO: Implement a method to delete a highlight
  async deleteHighlight(id: string): Promise<void> {
    // CHALLENGE: Implement the delete logic
    // Consider soft delete vs. hard delete approaches
  }

  // TODO: Implement a method to close the database connection
  async close(): Promise<void> {
    // CHALLENGE: Implement proper cleanup of database resources
    // await this.db.close();
  }
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
