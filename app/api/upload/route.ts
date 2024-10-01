import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDatabase() {
  return open({
    filename: './database/documents.db',
    driver: sqlite3.Database,
  });
}

export async function POST(req) {
  const formData = await req.formData();

  if (!formData.has('file')) {
    return NextResponse.json(null, { status: 400 });
  }

  try {
    const db = await openDatabase();
    
    await db.run(`CREATE TABLE IF NOT EXISTS "PDF Files" (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      filename TEXT, 
      filedata BLOB
    )`);

    const files = formData.getAll('file');
    for (const file of files) {
      await db.run(
        'INSERT INTO "PDF Files" (filename, filedata) VALUES (?, ?)', 
        [file.name, Buffer.from(await file.arrayBuffer())]
      );
    }

    await db.close();

    return NextResponse.json(null, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(null, { status: 500 });
  }
}
