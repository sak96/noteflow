import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FileList from '../components/FileList.vue';

vi.mock('../stores/notes.js', () => ({
  useNotesStore: vi.fn(() => ({
    loadNotes: vi.fn().mockResolvedValue(undefined),
    flatListItems: [],
    createNote: vi.fn().mockResolvedValue('new-id'),
    createDivider: vi.fn().mockResolvedValue('divider-id'),
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
    expect(wrapper.find('button[title="Add Note"]').exists()).toBe(true);
    expect(wrapper.find('button[title="Add Divider"]').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('renders note and divider buttons', async () => {
    const wrapper = mount(FileList);
    
    expect(wrapper.find('button[title="Add Note"]').exists()).toBe(true);
    expect(wrapper.find('button[title="Add Divider"]').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('renders notes in flat list', async () => {
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
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes,
      flatListItems: [],
      createNote: vi.fn(),
      createDivider: vi.fn(),
    });
    
    const wrapper = mount(FileList);
    
    expect(loadNotes).toHaveBeenCalled();
    
    wrapper.unmount();
  });

  it('renders divider with fold toggle', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes: vi.fn().mockResolvedValue(undefined),
      flatListItems: [
        { id: '1', name: 'Work', category: '', content: null, order: 0, createdAt: 0, updatedAt: 0 },
      ],
      createNote: vi.fn(),
      createDivider: vi.fn(),
    });
    
    const wrapper = mount(FileList);
    
    expect(wrapper.find('.fold-toggle').exists()).toBe(true);
    expect(wrapper.find('.divider-name').text()).toBe('Work');
    
    wrapper.unmount();
  });

  it('renders note item with title and edit button', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes: vi.fn().mockResolvedValue(undefined),
      flatListItems: [
        { id: '1', name: 'Test Note', category: '', content: 'content', order: 1, createdAt: 0, updatedAt: 0 },
      ],
      createNote: vi.fn(),
      createDivider: vi.fn(),
    });
    
    const wrapper = mount(FileList);
    
    expect(wrapper.find('.note-title').text()).toBe('Test Note');
    expect(wrapper.find('.note-item .btn-small').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('clicking divider toggles fold state', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    const createDivider = vi.fn();
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes: vi.fn().mockResolvedValue(undefined),
      flatListItems: [
        { id: '1', name: 'Work', category: '', content: null, order: 0, createdAt: 0, updatedAt: 0 },
        { id: '2', name: 'Note', category: '', content: 'content', order: 1, createdAt: 0, updatedAt: 0 },
      ],
      createNote: vi.fn(),
      createDivider,
    });
    
    const wrapper = mount(FileList);
    
    await wrapper.find('.divider-content').trigger('click');
    
    expect(wrapper.find('.fold-toggle').text()).toBe('📁');
    
    await wrapper.find('.divider-content').trigger('click');
    
    expect(wrapper.find('.fold-toggle').text()).toBe('📂');
    
    wrapper.unmount();
  });

  it('addDivider button calls createDivider', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    const createDivider = vi.fn().mockResolvedValue('div-id');
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes: vi.fn().mockResolvedValue(undefined),
      flatListItems: [],
      createNote: vi.fn(),
      createDivider,
    });
    
    const wrapper = mount(FileList);
    
    await wrapper.find('button[title="Add Divider"]').trigger('click');
    
    expect(createDivider).toHaveBeenCalledWith('New Section');
    
    wrapper.unmount();
  });

  it('renaming divider calls saveNote with new name', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    const saveNote = vi.fn().mockResolvedValue(undefined);
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes: vi.fn().mockResolvedValue(undefined),
      flatListItems: [
        { id: '1', name: 'Work', category: '', content: null, order: 0, createdAt: 0, updatedAt: 0 },
      ],
      createNote: vi.fn(),
      createDivider: vi.fn(),
      saveNote,
    });
    
    const wrapper = mount(FileList);
    
    const dividerName = wrapper.find('.divider-name');
    await dividerName.trigger('blur');
    
    expect(saveNote).toHaveBeenCalledWith('1', { name: 'Work' });
    
    wrapper.unmount();
  });
});
