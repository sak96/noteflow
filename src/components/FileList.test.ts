import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FileList from '../components/FileList.vue';

vi.mock('../stores/notes.js', () => ({
  useNotesStore: vi.fn(() => ({
    loadNotes: vi.fn().mockResolvedValue(undefined),
    groupedByCategory: {},
    categories: [],
    createNote: vi.fn().mockResolvedValue('new-id'),
    saveNote: vi.fn().mockResolvedValue(undefined),
    updateNoteOrders: vi.fn().mockResolvedValue(undefined),
    importNotes: vi.fn().mockResolvedValue(undefined),
    exportNotes: vi.fn().mockResolvedValue('[]'),
  })),
}));

vi.mock('../router.js', () => ({
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

describe('FileList component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders header with title and buttons', async () => {
    const wrapper = mount(FileList);
    
    expect(wrapper.text()).toContain('Notes');
    expect(wrapper.find('button').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('renders add note form with inputs', async () => {
    const wrapper = mount(FileList);
    
    expect(wrapper.find('[contenteditable]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Category"]').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('renders category dropdown with existing categories', async () => {
    const wrapper = mount(FileList);
    
    expect(wrapper.find('datalist#categories').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('renders notes grouped by category', async () => {
    const wrapper = mount(FileList);
    
    expect(wrapper.find('.filelist').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('displays notes list', async () => {
    const wrapper = mount(FileList);
    
    expect(wrapper.find('.notes-list').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('loads notes on mount', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    const loadNotes = vi.fn().mockResolvedValue(undefined);
    useNotesStore.mockReturnValue({
      loadNotes,
      groupedByCategory: {},
      categories: [],
      createNote: vi.fn(),
    });
    
    const wrapper = mount(FileList);
    
    expect(loadNotes).toHaveBeenCalled();
    
    wrapper.unmount();
  });
});
