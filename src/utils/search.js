import MiniSearch from 'minisearch';

let miniSearch = null;

export function initSearch(notes) {
  miniSearch = new MiniSearch({
    fields: ['name', 'content'],
    storeFields: ['id', 'name'],
  });
  miniSearch.addAll(notes);
}

export function search(query) {
  if (!miniSearch || !query) return [];
  return miniSearch.search(query);
}

export function rebuildSearchIndex(notes) {
  initSearch(notes);
}
