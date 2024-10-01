// app/utils/BaseStorage.ts

import SQLiteDatabase from "./sqliteUtils";

class BaseStorage {
  protected db: SQLiteDatabase;

  constructor() {
    this.db = new SQLiteDatabase();
  }
  async close(): Promise<void> {
    await this.db.close();
  }
}

// Export the BaseStorage class for use in other parts of the application
export default BaseStorage;
