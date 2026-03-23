import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Note } from '../types/index.js';

let mockDbVersion = 1;

vi.mock('idb', () => {
  const mockStore = {
    get: vi.fn(),
    getAll: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    createIndex: vi.fn(),
  };
  
  const mockDB = {
    objectStoreNames: { contains: vi.fn(() => false) },
    createObjectStore: vi.fn(() => mockStore),
    transaction: vi.fn(() => ({
      store: mockStore,
      done: Promise.resolve(),
    })),
    getAll: vi.fn(),
    get: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  };
  
  return {
    openDB: vi.fn((_name, version, options) => {
      const oldVersion = mockDbVersion;
      mockDbVersion = version;
      if (options?.upgrade && oldVersion < version) {
        options.upgrade(mockDB, oldVersion, version);
      }
      return Promise.resolve(mockDB);
    }),
    __mockStore: mockStore,
    __mockDB: mockDB,
  };
});

import { openDB } from 'idb';
import {
  initDB,
  getAllNotes,
  getNoteById,
  addNote,
  updateNote,
  deleteNote,
  clearAllNotes,
  bulkImport,
  getAllCategories,
  generateId,
} from '../utils/db.js';

type MockDB = ReturnType<typeof vi.fn> & {
  getAll: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

type MockStore = ReturnType<typeof vi.fn> & {
  put: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

describe('db utility', () => {
  let mockDB: MockDB;
  let mockStore: MockStore;
  
  beforeEach(async () => {
    const idb = await import('idb');
    mockDB = (idb as unknown as { __mockDB: MockDB }).__mockDB;
    mockStore = (idb as unknown as { __mockStore: MockStore }).__mockStore;
    vi.clearAllMocks();
  });

  describe('initDB', () => {
    it('creates database on first call', async () => {
      mockDB.getAll = vi.fn().mockResolvedValue([]);
      
      await initDB();
      
      expect(openDB).toHaveBeenCalledWith('noteflow', 2, expect.any(Object));
    });
  });

  describe('getAllNotes', () => {
    it('returns all notes from store', async () => {
      const notes: Note[] = [{ id: '1', name: 'Note 1', category: '', content: '', order: 0, createdAt: 0, updatedAt: 0 }];
      mockDB.getAll.mockResolvedValue(notes);
      
      const result = await getAllNotes();
      
      expect(result).toEqual(notes);
    });
  });

  describe('getNoteById', () => {
    it('returns note by id', async () => {
      const note: Note = { id: '1', name: 'Note 1', category: '', content: '', order: 0, createdAt: 0, updatedAt: 0 };
      mockDB.get.mockResolvedValue(note);
      
      const result = await getNoteById('1');
      
      expect(result).toEqual(note);
    });
  });

  describe('addNote', () => {
    it('adds note to store', async () => {
      const note: Note = { id: '1', name: 'Note 1', category: '', content: '', order: 0, createdAt: 0, updatedAt: 0 };
      
      await addNote(note);
      
      expect(mockDB.add).toHaveBeenCalledWith('notes', note);
    });
  });

  describe('updateNote', () => {
    it('updates existing note', async () => {
      const existing = { id: '1', name: 'Old', content: '', category: '', order: 0, createdAt: 0, updatedAt: 0 };
      mockDB.get.mockResolvedValue(existing);
      
      await updateNote('1', { name: 'New' });
      
      expect(mockDB.put).toHaveBeenCalledWith(
        'notes',
        expect.objectContaining({ name: 'New' })
      );
    });

    it('returns null if note not found', async () => {
      mockDB.get.mockResolvedValue(null);
      
      const result = await updateNote('999', { name: 'New' });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteNote', () => {
    it('deletes note by id', async () => {
      await deleteNote('1');
      
      expect(mockDB.delete).toHaveBeenCalledWith('notes', '1');
    });
  });

  describe('clearAllNotes', () => {
    it('clears all notes from store', async () => {
      await clearAllNotes();
      
      expect(mockDB.clear).toHaveBeenCalledWith('notes');
    });
  });

  describe('bulkImport', () => {
    it('clears and imports all notes', async () => {
      const notes: Note[] = [
        { id: '1', name: 'Note 1', category: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '2', name: 'Note 2', category: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
      ];
      
      await bulkImport(notes);
      
      expect(mockStore.clear).toHaveBeenCalled();
    });
  });

  describe('getAllCategories', () => {
    it('returns unique sorted categories', async () => {
      const notes: Note[] = [
        { id: '1', category: 'work', name: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '2', category: 'personal', name: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '3', category: 'work', name: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '4', category: '', name: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '5', category: '', name: '', content: '', order: 0, createdAt: 0, updatedAt: 0 },
      ];
      mockDB.getAll.mockResolvedValue(notes);
      
      const result = await getAllCategories();
      
      expect(result).toEqual(['personal', 'work']);
    });

    it('returns empty array when no categories', async () => {
      mockDB.getAll.mockResolvedValue([]);
      
      const result = await getAllCategories();
      
      expect(result).toEqual([]);
    });
  });

  describe('generateId', () => {
    it('generates unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toEqual(id2);
    });

    it('generates string ids', () => {
      const id = generateId();
      
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('migrateToV2', () => {
    let mockDB: MockDB;
    let mockStore: MockStore;

    beforeEach(async () => {
      const idb = await import('idb');
      mockDB = (idb as unknown as { __mockDB: MockDB }).__mockDB;
      mockStore = (idb as unknown as { __mockStore: MockStore }).__mockStore;
      vi.clearAllMocks();
    });

    const createOldNote = (id: string, name: string, category: string, order: number): Note => ({
      id,
      name,
      category,
      content: `content ${id}`,
      order,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    it('creates dividers for each category in ascending order', async () => {
      mockDbVersion = 1;
      const oldNotes: Note[] = [
        createOldNote('1', 'Note 1', 'work', 0),
        createOldNote('2', 'Note 2', 'personal', 1),
        createOldNote('3', 'Note 3', 'work', 2),
      ];
      mockDB.getAll = vi.fn().mockResolvedValue(oldNotes);

      await initDB();

      const allPuts = mockStore.put.mock.calls.map((call: unknown[]) => call[0] as Note);
      const dividers = allPuts.filter(n => n.content === null);
      const notes = allPuts.filter(n => n.content !== null);

      expect(dividers).toHaveLength(2);
      expect(dividers[0].name).toBe('personal');
      expect(dividers[1].name).toBe('work');

      expect(notes).toHaveLength(3);
      expect(notes[0].category).toBe('personal');
      expect(notes[1].category).toBe('work');
      expect(notes[2].category).toBe('work');
    });

    it('creates Uncategorized divider first when uncategorized notes exist', async () => {
      mockDbVersion = 1;
      const oldNotes: Note[] = [
        createOldNote('1', 'Note 1', '', 0),
        createOldNote('2', 'Note 2', 'work', 1),
      ];
      mockDB.getAll = vi.fn().mockResolvedValue(oldNotes);

      await initDB();

      const allPuts = mockStore.put.mock.calls.map((call: unknown[]) => call[0] as Note);
      const dividers = allPuts.filter(n => n.content === null);

      expect(dividers).toHaveLength(2);
      expect(dividers[0].name).toBe('Uncategorized');
      expect(dividers[1].name).toBe('work');
    });

    it('preserves note order within category by original order then insertion', async () => {
      mockDbVersion = 1;
      const oldNotes: Note[] = [
        createOldNote('1', 'Note A', 'work', 5),
        createOldNote('2', 'Note B', 'work', 2),
        createOldNote('3', 'Note C', 'work', 2),
      ];
      mockDB.getAll = vi.fn().mockResolvedValue(oldNotes);

      await initDB();

      const allPuts = mockStore.put.mock.calls.map((call: unknown[]) => call[0] as Note);
      const workNotes = allPuts.filter(n => n.category === 'work');

      expect(workNotes[0].name).toBe('Note B');
      expect(workNotes[1].name).toBe('Note C');
      expect(workNotes[2].name).toBe('Note A');
    });

    it('assigns sequential order starting from 0', async () => {
      mockDbVersion = 1;
      const oldNotes: Note[] = [
        createOldNote('1', 'Note 1', 'work', 100),
        createOldNote('2', 'Note 2', 'personal', 200),
      ];
      mockDB.getAll = vi.fn().mockResolvedValue(oldNotes);

      await initDB();

      const allPuts = mockStore.put.mock.calls.map((call: unknown[]) => call[0] as Note);
      allPuts.sort((a, b) => a.order - b.order);

      expect(allPuts[0].order).toBe(0);
      expect(allPuts[0].content).toBeNull();
      expect(allPuts[1].order).toBe(1);
      expect(allPuts[1].content).toBe('content 2');
      expect(allPuts[2].order).toBe(2);
      expect(allPuts[2].content).toBeNull();
      expect(allPuts[3].order).toBe(3);
      expect(allPuts[3].content).toBe('content 1');
    });

    it('preserves original category on notes', async () => {
      mockDbVersion = 1;
      const oldNotes: Note[] = [
        createOldNote('1', 'Note 1', 'work', 0),
        createOldNote('2', 'Note 2', 'personal', 1),
      ];
      mockDB.getAll = vi.fn().mockResolvedValue(oldNotes);

      await initDB();

      const allPuts = mockStore.put.mock.calls.map((call: unknown[]) => call[0] as Note);
      const notes = allPuts.filter(n => n.content !== null);

      expect(notes.find(n => n.name === 'Note 1')?.category).toBe('work');
      expect(notes.find(n => n.name === 'Note 2')?.category).toBe('personal');
    });

    it('does not run migration if already at version 2', async () => {
      mockDbVersion = 1;
      const oldNotes: Note[] = [
        { id: 'div1', name: 'work', category: '', content: null, order: 0, createdAt: 0, updatedAt: 0 },
        createOldNote('1', 'Note 1', 'work', 1),
      ];
      mockDB.getAll = vi.fn().mockResolvedValue(oldNotes);

      await initDB();

      expect(mockStore.put).not.toHaveBeenCalled();
    });

    it('skips migration if no notes exist', async () => {
      mockDbVersion = 1;
      mockDB.getAll = vi.fn().mockResolvedValue([]);

      await initDB();

      expect(mockStore.put).not.toHaveBeenCalled();
    });
  });
});
