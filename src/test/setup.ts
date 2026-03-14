import { vi } from 'vitest';

const storage = new Map<string, string>();

export const localStorage = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
  clear: vi.fn(() => storage.clear()),
  key: vi.fn((i: number) => Array.from(storage.keys())[i] ?? null),
  get length() { return storage.size; },
};

globalThis.localStorage = localStorage as Storage;