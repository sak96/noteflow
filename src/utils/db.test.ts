import { describe, it, expect, beforeEach, vi } from 'vitest';

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
    openDB: vi.fn(() => Promise.resolve(mockDB)),
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

describe('db utility', () => {
  let mockDB;
  let mockStore;
  
  beforeEach(async () => {
    const { __mockDB, __mockStore } = await import('idb');
    mockDB = __mockDB;
    mockStore = __mockStore;
    vi.clearAllMocks();
  });

  describe('initDB', () => {
    it('creates database on first call', async () => {
      await initDB();
      
      expect(openDB).toHaveBeenCalledWith('noteflow', 1, expect.any(Object));
    });
  });

  describe('getAllNotes', () => {
    it('returns all notes from store', async () => {
      const notes = [{ id: '1', name: 'Note 1' }];
      mockDB.getAll.mockResolvedValue(notes);
      
      const result = await getAllNotes();
      
      expect(result).toEqual(notes);
    });
  });

  describe('getNoteById', () => {
    it('returns note by id', async () => {
      const note = { id: '1', name: 'Note 1' };
      mockDB.get.mockResolvedValue(note);
      
      const result = await getNoteById('1');
      
      expect(result).toEqual(note);
    });
  });

  describe('addNote', () => {
    it('adds note to store', async () => {
      const note = { id: '1', name: 'Note 1' };
      
      await addNote(note);
      
      expect(mockDB.add).toHaveBeenCalledWith('notes', note);
    });
  });

  describe('updateNote', () => {
    it('updates existing note', async () => {
      const existing = { id: '1', name: 'Old', content: '' };
      const updated = { id: '1', name: 'New', content: '', updatedAt: Date.now() };
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
      const notes = [
        { id: '1', name: 'Note 1' },
        { id: '2', name: 'Note 2' },
      ];
      
      await bulkImport(notes);
      
      expect(mockStore.clear).toHaveBeenCalled();
    });
  });

  describe('getAllCategories', () => {
    it('returns unique sorted categories', async () => {
      const notes = [
        { id: '1', category: 'work' },
        { id: '2', category: 'personal' },
        { id: '3', category: 'work' },
        { id: '4', category: '' },
        { id: '5', category: null },
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
});
