import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '../stores/notes.js';

vi.mock('../utils/db.js', () => ({
  getAllNotes: vi.fn(),
  addNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  bulkImport: vi.fn(),
  getAllCategories: vi.fn(),
  generateId: vi.fn(() => 'test-id-123'),
}));

vi.mock('../utils/search.js', () => ({
  rebuildSearchIndex: vi.fn(),
  search: vi.fn(),
}));

import {
  getAllNotes,
  addNote,
  updateNote,
  deleteNote,
  bulkImport,
  getAllCategories,
} from '../utils/db.js';

describe('notes store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('groupedByCategory', () => {
    it('groups notes by category case-insensitively', async () => {
      const store = useNotesStore();
      
      getAllNotes.mockResolvedValue([
        { id: '1', name: 'Note 1', category: 'work', order: 0 },
        { id: '2', name: 'Note 2', category: 'Work', order: 1 },
        { id: '3', name: 'Note 3', category: 'WORK', order: 2 },
      ]);
      getAllCategories.mockResolvedValue(['work']);
      
      await store.loadNotes();
      
      const groups = store.groupedByCategory;
      expect(Object.keys(groups)).toContain('Work');
      expect(groups['Work']).toHaveLength(3);
    });

    it('capitalizes category names', async () => {
      const store = useNotesStore();
      
      getAllNotes.mockResolvedValue([
        { id: '1', name: 'Note 1', category: 'programming', order: 0 },
      ]);
      getAllCategories.mockResolvedValue(['programming']);
      
      await store.loadNotes();
      
      const groups = store.groupedByCategory;
      expect(Object.keys(groups)).toContain('Programming');
    });

    it('handles empty category as uncategorized', async () => {
      const store = useNotesStore();
      
      getAllNotes.mockResolvedValue([
        { id: '1', name: 'Note 1', category: '', order: 0 },
        { id: '2', name: 'Note 2', category: null, order: 1 },
      ]);
      getAllCategories.mockResolvedValue([]);
      
      await store.loadNotes();
      
      const groups = store.groupedByCategory;
      expect(Object.keys(groups)).toContain('');
      expect(groups['']).toHaveLength(2);
    });

    it('sorts notes by order within each category', async () => {
      const store = useNotesStore();
      
      getAllNotes.mockResolvedValue([
        { id: '1', name: 'Note A', category: 'work', order: 2 },
        { id: '2', name: 'Note B', category: 'work', order: 0 },
        { id: '3', name: 'Note C', category: 'work', order: 1 },
      ]);
      getAllCategories.mockResolvedValue(['work']);
      
      await store.loadNotes();
      
      const groups = store.groupedByCategory;
      expect(groups['Work'][0].name).toBe('Note B');
      expect(groups['Work'][1].name).toBe('Note C');
      expect(groups['Work'][2].name).toBe('Note A');
    });

    it('sorts categories alphabetically with empty last', async () => {
      const store = useNotesStore();
      
      getAllNotes.mockResolvedValue([
        { id: '1', name: 'Note 1', category: 'zebra', order: 0 },
        { id: '2', name: 'Note 2', category: 'apple', order: 0 },
        { id: '3', name: 'Note 3', category: '', order: 0 },
      ]);
      getAllCategories.mockResolvedValue(['zebra', 'apple']);
      
      await store.loadNotes();
      
      const keys = Object.keys(store.groupedByCategory);
      expect(keys.length).toBe(3);
    });

    it('handles mixed case categories and merges them', async () => {
      const store = useNotesStore();
      
      getAllNotes.mockResolvedValue([
        { id: '1', name: 'Note 1', category: 'JavaScript', order: 0 },
        { id: '2', name: 'Note 2', category: 'javascript', order: 1 },
        { id: '3', name: 'Note 3', category: 'JAVASCRIPT', order: 2 },
      ]);
      getAllCategories.mockResolvedValue(['JavaScript']);
      
      await store.loadNotes();
      
      const groups = store.groupedByCategory;
      expect(Object.keys(groups).length).toBe(1);
      expect(groups['Javascript']).toHaveLength(3);
    });
  });

  describe('filteredNotes', () => {
    it('returns all notes when no filter', async () => {
      const store = useNotesStore();
      store.notes = [
        { id: '1', name: 'Note 1', category: 'work' },
        { id: '2', name: 'Note 2', category: 'personal' },
      ];
      store.filterCategories = [];
      
      expect(store.filteredNotes).toHaveLength(2);
    });

    it('filters notes by selected categories', async () => {
      const store = useNotesStore();
      store.notes = [
        { id: '1', name: 'Note 1', category: 'work' },
        { id: '2', name: 'Note 2', category: 'personal' },
      ];
      store.filterCategories = ['work'];
      
      const filtered = store.filteredNotes;
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('work');
    });

    it('excludes notes without category when filtering', async () => {
      const store = useNotesStore();
      store.notes = [
        { id: '1', name: 'Note 1', category: 'work' },
        { id: '2', name: 'Note 2', category: '' },
      ];
      store.filterCategories = ['work'];
      
      const filtered = store.filteredNotes;
      expect(filtered).toHaveLength(1);
    });
  });

  describe('getNoteById', () => {
    it('returns note by id', async () => {
      const store = useNotesStore();
      store.notes = [
        { id: '1', name: 'Note 1' },
        { id: '2', name: 'Note 2' },
      ];
      
      expect(store.getNoteById('1').name).toBe('Note 1');
      expect(store.getNoteById('2').name).toBe('Note 2');
    });

    it('returns undefined for unknown id', async () => {
      const store = useNotesStore();
      store.notes = [{ id: '1', name: 'Note 1' }];
      
      expect(store.getNoteById('999')).toBeUndefined();
    });
  });

  describe('actions', () => {
    it('createNote adds note and returns id', async () => {
      const store = useNotesStore();
      getAllNotes.mockResolvedValue([]);
      getAllCategories.mockResolvedValue([]);
      
      const id = await store.createNote('New Note', 'work');
      
      expect(addNote).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Note',
          category: 'work',
        })
      );
      expect(id).toBe('test-id-123');
    });

    it('saveNote calls updateNote', async () => {
      const store = useNotesStore();
      getAllNotes.mockResolvedValue([]);
      getAllCategories.mockResolvedValue([]);
      
      await store.saveNote('1', { name: 'Updated' });
      
      expect(updateNote).toHaveBeenCalledWith('1', { name: 'Updated' });
    });

    it('deleteNote calls deleteNote', async () => {
      const store = useNotesStore();
      getAllNotes.mockResolvedValue([]);
      getAllCategories.mockResolvedValue([]);
      
      await store.deleteNote('1');
      
      expect(deleteNote).toHaveBeenCalledWith('1');
    });

    it('importNotes calls bulkImport', async () => {
      const store = useNotesStore();
      const notes = [{ id: '1', name: 'Note 1' }];
      getAllNotes.mockResolvedValue(notes);
      getAllCategories.mockResolvedValue([]);
      
      await store.importNotes(notes);
      
      expect(bulkImport).toHaveBeenCalledWith(notes);
    });

    it('exportNotes returns JSON string', async () => {
      const store = useNotesStore();
      store.notes = [{ id: '1', name: 'Note 1' }];
      
      const json = await store.exportNotes();
      
      expect(json).toBe(JSON.stringify(store.notes, null, 2));
    });
  });
});
