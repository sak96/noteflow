import MiniSearch from 'minisearch';
import type { Note } from '../types/index';
import { isDivider } from '../types/index';

let miniSearch: MiniSearch<Note> | null = null;

interface MiniSearchResult {
  id: string;
  name?: string;
  score: number;
}

export function initSearch(notes: Note[]): void {
  miniSearch = new MiniSearch<Note>({
    fields: ['name', 'content'],
    storeFields: ['id', 'name'],
  });
  miniSearch.addAll(notes.filter(note => !isDivider(note)));
}

export function search(query: string): Array<{ id: string; name: string; score: number }> {
  if (!miniSearch || !query) return [];
  return miniSearch.search(query).map(result => ({
    id: result.id as string,
    name: (result as MiniSearchResult).name || '',
    score: result.score,
  }));
}

export function rebuildSearchIndex(notes: Note[]): void {
  initSearch(notes);
}
