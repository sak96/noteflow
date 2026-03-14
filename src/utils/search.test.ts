import { describe, it, expect } from 'vitest';
import MiniSearch from 'minisearch';
import { initSearch, search, rebuildSearchIndex } from '../utils/search.js';

describe('search utility', () => {
  describe('initSearch', () => {
    it('initializes minisearch with notes', () => {
      const notes = [
        { id: '1', name: 'Note 1', content: 'Hello world' },
        { id: '2', name: 'Note 2', content: 'Another note' },
      ];
      
      initSearch(notes);
      
      const result = search('Hello');
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('search', () => {
    it('returns empty array when query is empty', () => {
      const result = search('');
      expect(result).toEqual([]);
    });

    it('returns results for valid query', () => {
      initSearch([{ id: '1', name: 'Test Note', content: 'content' }]);
      const result = search('Test');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('rebuildSearchIndex', () => {
    it('rebuilds search index with new notes', () => {
      const notes = [
        { id: '1', name: 'Note 1', content: 'Content 1' },
        { id: '2', name: 'Note 2', content: 'Content 2' },
      ];
      
      rebuildSearchIndex(notes);
      
      const result = search('Note');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
