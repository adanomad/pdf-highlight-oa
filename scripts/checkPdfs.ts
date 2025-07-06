// scripts/checkPdfs.ts
// Testing function to check the list of uploaded PDFs in the pdf_documents table
// To test, run: npx tsx scripts/checkPdfs.ts

import SQLiteDatabase from "../app/utils/sqliteUtils";

(async () => {
  const db = new SQLiteDatabase();
  const rawDb = (db as any).db;

  rawDb.all(
    "SELECT id, filename, filesize, LENGTH(content) as stored_bytes, upload_time FROM pdf_documents",
    [],
    (err: any, rows: any[]) => {
      if (err) {
        console.error("Error reading pdf_documents:", err);
      } else {
        console.log("PDFs currently stored in pdf_documents:");
        console.table(rows);
      }
      db.close();
    }
  );
})();
