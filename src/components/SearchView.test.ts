import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SearchView from '../components/SearchView.vue';

vi.mock('../stores/notes.js', () => ({
  useNotesStore: vi.fn(() => ({
    loadNotes: vi.fn().mockResolvedValue(undefined),
    performSearch: vi.fn().mockReturnValue([]),
    getNoteById: vi.fn().mockReturnValue(null),
  })),
}));

vi.mock('../router.js', () => ({
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

describe('Search component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders search header with home button', async () => {
    const wrapper = mount(SearchView);
    
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(wrapper.find('input[placeholder="Search notes..."]').exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('renders search input', async () => {
    const wrapper = mount(SearchView);
    
    const input = wrapper.find('input[type="text"]');
    expect(input.exists()).toBe(true);
    
    wrapper.unmount();
  });

  it('shows no results message when query has no matches', async () => {
    const wrapper = mount(SearchView);
    
    await wrapper.find('input[type="text"]').setValue('nonexistent');
    await wrapper.trigger('input');
    
    expect(wrapper.text()).toContain('No results found');
    
    wrapper.unmount();
  });

  it('loads notes on mount', async () => {
    const { useNotesStore } = await import('../stores/notes.js');
    const loadNotes = vi.fn().mockResolvedValue(undefined);
    (useNotesStore as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: unknown) => void }).mockReturnValue({
      loadNotes,
      performSearch: vi.fn().mockReturnValue([]),
      getNoteById: vi.fn(),
    });
    
    const wrapper = mount(SearchView);
    
    expect(loadNotes).toHaveBeenCalled();
    
    wrapper.unmount();
  });

  it('clears results when query is empty', async () => {
    const wrapper = mount(SearchView);
    
    await wrapper.find('input[type="text"]').setValue('');
    await wrapper.trigger('input');
    
    expect(wrapper.find('.result-item').exists()).toBe(false);
    
    wrapper.unmount();
  });
});
