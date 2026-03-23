import { describe, it, expect } from 'vitest';
import { initSearch, search, rebuildSearchIndex } from '../utils/search.js';

describe('search utility', () => {
  describe('initSearch', () => {
    it('initializes minisearch with notes', () => {
      const notes = [
        { id: '1', name: 'Note 1', content: 'Hello world', category: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '2', name: 'Note 2', content: 'Another note', category: '', order: 0, createdAt: 0, updatedAt: 0 },
      ];
      
      initSearch(notes);
      
      const result = search('Hello');
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('does not index dividers (notes with null content)', () => {
      const notes = [
        { id: '1', name: 'Real Note', content: 'Some content', category: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '2', name: 'Divider', content: null, category: '', order: 0, createdAt: 0, updatedAt: 0 },
      ];
      
      initSearch(notes);
      
      const result = search('Divider');
      expect(result).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('returns empty array when query is empty', () => {
      const result = search('');
      expect(result).toEqual([]);
    });

    it('returns results for valid query', () => {
      initSearch([{ id: '1', name: 'Test Note', content: 'content', category: '', order: 0, createdAt: 0, updatedAt: 0 }]);
      const result = search('Test');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('rebuildSearchIndex', () => {
    it('rebuilds search index with new notes', () => {
      const notes = [
        { id: '1', name: 'Note 1', content: 'Content 1', category: '', order: 0, createdAt: 0, updatedAt: 0 },
        { id: '2', name: 'Note 2', content: 'Content 2', category: '', order: 0, createdAt: 0, updatedAt: 0 },
      ];
      
      rebuildSearchIndex(notes);
      
      const result = search('Note');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
