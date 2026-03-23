import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FileView from '../components/FileView.vue';

class MockEditorInstance {
  state = { selection: null };
  _onChangeCallback: (() => void) | null = null;
  getValue() { return 'content'; }
  setValue() {}
  destroy() {}
  insertText() {}
  setSelection() {}
}

let mockInstance: MockEditorInstance | null = null;

const { MockEditor } = vi.hoisted(() => {
  const MockEditor = function(_container: HTMLElement, options: { onChange?: () => void }) {
    const instance = new MockEditorInstance();
    if (options?.onChange) {
      instance._onChangeCallback = options.onChange;
    }
    mockInstance = instance;
    return [instance];
  };

  return { MockEditor };
});

vi.mock('overtype', () => ({
  default: MockEditor,
}));

const mockSaveNote = vi.fn().mockResolvedValue(undefined);
const mockGetNoteById = vi.fn().mockReturnValue({ id: '1', name: 'Note 1', content: '' });

vi.mock('../stores/notes', () => ({
  useNotesStore: () => ({
    loadNotes: vi.fn().mockResolvedValue(undefined),
    getNoteById: mockGetNoteById,
    saveNote: mockSaveNote,
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

  it('does not have save button (autosave enabled)', async () => {
    const wrapper = mount(FileView, { props: { id: '1' } });
    expect(wrapper.find('button:contains("💾")').exists()).toBe(false);
    wrapper.unmount();
  });

  describe('auto save', () => {
    beforeEach(() => {
      mockInstance = null;
      mockSaveNote.mockClear();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('triggers auto save after content change delay', async () => {
      const wrapper = mount(FileView, { props: { id: '1' } });
      await vi.runAllTimersAsync();
      
      mockInstance!._onChangeCallback?.();
      
      expect(mockSaveNote).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(3000);
      
      expect(mockSaveNote).toHaveBeenCalledTimes(1);
      expect(mockSaveNote).toHaveBeenCalledWith('1', { content: 'content' });
      
      wrapper.unmount();
    });

    it('debounces rapid content changes', async () => {
      const wrapper = mount(FileView, { props: { id: '1' } });
      await vi.runAllTimersAsync();
      
      mockInstance!._onChangeCallback?.();
      vi.advanceTimersByTime(1000);
      mockInstance!._onChangeCallback?.();
      vi.advanceTimersByTime(1000);
      mockInstance!._onChangeCallback?.();
      
      expect(mockSaveNote).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(3000);
      
      expect(mockSaveNote).toHaveBeenCalledTimes(1);
      
      wrapper.unmount();
    });

    it('saves correct content from editor', async () => {
      const wrapper = mount(FileView, { props: { id: '1' } });
      await vi.runAllTimersAsync();
      mockInstance!.getValue = vi.fn().mockReturnValue('test content');
      
      mockInstance!._onChangeCallback?.();
      vi.advanceTimersByTime(3000);
      
      expect(mockSaveNote).toHaveBeenCalledWith('1', { content: 'test content' });
      
      wrapper.unmount();
    });

    it('saves on unmount when there are pending changes', async () => {
      const wrapper = mount(FileView, { props: { id: '1' } });
      await vi.runAllTimersAsync();
      
      mockInstance!._onChangeCallback?.();
      
      wrapper.unmount();
      
      expect(mockSaveNote).toHaveBeenCalledTimes(1);
      expect(mockSaveNote).toHaveBeenCalledWith('1', { content: 'content' });
    });
  });
});
