import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { Book, Section, Note, Presentation } from '../types';

const DB_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'speedlearning.json');

interface DbSchema {
  books: Book[];
  sections: Section[];
  notes: Note[];
  presentations: Presentation[];
}

const defaultData: DbSchema = {
  books: [],
  sections: [],
  notes: [],
  presentations: []
};

let dbInstance: Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>> | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await JSONFilePreset<DbSchema>(DB_PATH, defaultData);
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.read();
  console.log('✅ Database initialized at:', DB_PATH);
  console.log(`   📚 Books: ${db.data.books.length}`);
  console.log(`   📑 Sections: ${db.data.sections.length}`);
  console.log(`   📝 Notes: ${db.data.notes.length}`);
  console.log(`   🎨 Presentations: ${db.data.presentations.length}`);
}
