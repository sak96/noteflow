import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FileView from '../components/FileView.vue';

const { MockEditor } = vi.hoisted(() => {
  class MockEditorInstance {
    constructor() {
      this.state = { selection: null };
    }
    getValue() { return 'content'; }
    setValue() {}
    destroy() {}
    insertText() {}
    setSelection() {}
  }

  const MockEditor = function() {
    return [new MockEditorInstance()];
  };

  return { MockEditor };
});

vi.mock('overtype', () => ({
  default: MockEditor,
}));

vi.mock('../stores/notes.js', () => ({
  useNotesStore: () => ({
    loadNotes: vi.fn().mockResolvedValue(undefined),
    getNoteById: vi.fn().mockReturnValue({ id: '1', name: 'Note 1', content: '' }),
    saveNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../router.js', () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
}));

describe('File component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  });

  it('renders without crashing', async () => {
    const wrapper = mount(FileView, { props: { id: '1' } });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('has header section', async () => {
    const wrapper = mount(FileView, { props: { id: '1' } });
    expect(wrapper.find('.header').exists()).toBe(true);
    wrapper.unmount();
  });

  it('has editor container', async () => {
    const wrapper = mount(FileView, { props: { id: '1' } });
    expect(wrapper.find('.editor-container').exists()).toBe(true);
    wrapper.unmount();
  });

  it('has title input', async () => {
    const wrapper = mount(FileView, { props: { id: '1' } });
    expect(wrapper.find('.title-input').exists()).toBe(true);
    wrapper.unmount();
  });

  it('has delete dialog', async () => {
    const wrapper = mount(FileView, { props: { id: '1' } });
    expect(wrapper.find('dialog').exists()).toBe(true);
    wrapper.unmount();
  });
});
