import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Note, NoteUpdate } from '../types/index';

export type { Note, NoteUpdate };

const DB_NAME = 'noteflow';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

interface NoteflowDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: {
      category: string;
      order: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<NoteflowDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<NoteflowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NoteflowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category');
          store.createIndex('order', 'order');
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function getNoteById(id: string): Promise<Note | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function addNote(note: Note): Promise<string> {
  const db = await initDB();
  return db.add(STORE_NAME, note);
}

export async function updateNote(id: string, updates: NoteUpdate): Promise<string | null> {
  const db = await initDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return null;
  const updated: Note = { ...existing, ...updates, updatedAt: Date.now() };
  return db.put(STORE_NAME, updated);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

export async function clearAllNotes(): Promise<void> {
  const db = await initDB();
  return db.clear(STORE_NAME);
}

export async function bulkImport(notes: Note[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await Promise.all(notes.map(note => tx.store.put(note)));
  await tx.done;
}

export async function getAllCategories(): Promise<string[]> {
  const notes = await getAllNotes();
  const categories = new Set(notes.map(n => n.category).filter((c): c is string => !!c));
  return Array.from(categories).sort();
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
