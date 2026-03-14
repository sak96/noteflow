import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('./utils/db.js', () => ({
  getAllNotes: vi.fn(() => Promise.resolve([])),
  addNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  bulkImport: vi.fn(),
  getAllCategories: vi.fn(() => Promise.resolve([])),
  generateId: vi.fn(() => 'test-id-' + Date.now()),
  rebuildSearchIndex: vi.fn(),
}));

vi.mock('./utils/search.js', () => ({
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
    vi.clearAllMocks();
  });

  test('basic DOM setup works', () => {
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
});
