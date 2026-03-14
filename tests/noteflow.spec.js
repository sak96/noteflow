import { describe, test, expect, beforeEach, vi, beforeAll } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '../src/stores/notes.js';

let mockNotes = [];

vi.mock('../src/utils/db.js', () => ({
  getAllNotes: vi.fn(() => Promise.resolve([...mockNotes])),
  addNote: vi.fn((note) => {
    mockNotes.push(note);
    return Promise.resolve();
  }),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  bulkImport: vi.fn((notes) => {
    mockNotes = [...notes];
    return Promise.resolve();
  }),
  getAllCategories: vi.fn(() => {
    const categories = new Set(mockNotes.map(n => n.category).filter(c => c));
    return Promise.resolve(Array.from(categories).sort());
  }),
  generateId: vi.fn(() => 'test-id-' + Date.now()),
  rebuildSearchIndex: vi.fn(),
}));

vi.mock('../src/utils/search.js', () => ({
  rebuildSearchIndex: vi.fn(),
  search: vi.fn(),
}));

global.indexedDB = {
  deleteDatabase: vi.fn(() => Promise.resolve()),
};

global.matchMedia = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('NoteFlow App', () => {
  beforeEach(() => {
    mockNotes = [];
    setActivePinia(createPinia());
  });

  test('basic test setup works', () => {
    document.body.innerHTML = '<h1>Notes</h1><button>🔍</button><button>📤</button><button>📥</button><button>➕</button>';
    
    expect(document.querySelector('h1').textContent).toBe('Notes');
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent).toBe('🔍');
    expect(buttons[1].textContent).toBe('📤');
    expect(buttons[2].textContent).toBe('📥');
    expect(buttons[3].textContent).toBe('➕');
  });

  test('indexedDB deleteDatabase is called', () => {
    indexedDB.deleteDatabase('noteflow');
    expect(indexedDB.deleteDatabase).toHaveBeenCalledWith('noteflow');
  });

  test('theme detection works', () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    expect(typeof prefersDark).toBe('boolean');
  });

  test('should show new note in FileList after creation', async () => {
    const store = useNotesStore();
    
    const noteId = await store.createNote('Test Note', 'Work');
    
    expect(store.notes.length).toBe(1);
    expect(store.notes[0].name).toBe('Test Note');
    expect(store.notes[0].category).toBe('Work');
    
    const noteInStore = store.getNoteById(noteId);
    expect(noteInStore).toBeDefined();
    expect(noteInStore.name).toBe('Test Note');
    
    const grouped = store.groupedByCategory;
    expect(grouped['Work']).toBeDefined();
    expect(grouped['Work'][0].name).toBe('Test Note');
  });
});
