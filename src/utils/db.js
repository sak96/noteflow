import { openDB } from 'idb';

const DB_NAME = 'noteflow';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

let dbPromise = null;

export async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
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

export async function getAllNotes() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function getNoteById(id) {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function addNote(note) {
  const db = await initDB();
  return db.add(STORE_NAME, note);
}

export async function updateNote(id, updates) {
  const db = await initDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  return db.put(STORE_NAME, updated);
}

export async function deleteNote(id) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

export async function clearAllNotes() {
  const db = await initDB();
  return db.clear(STORE_NAME);
}

export async function bulkImport(notes) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await Promise.all(notes.map(note => tx.store.put(note)));
  await tx.done;
}

export async function getAllCategories() {
  const notes = await getAllNotes();
  const categories = new Set(notes.map(n => n.category).filter(c => c));
  return Array.from(categories).sort();
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
