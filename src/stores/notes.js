import { defineStore } from 'pinia';
import { getAllNotes, addNote, updateNote, deleteNote, bulkImport, getAllCategories, generateId } from '../utils/db.js';
import { rebuildSearchIndex, search } from '../utils/search.js';

export const useNotesStore = defineStore('notes', {
  state: () => ({
    notes: [],
    categories: [],
    filterCategories: [],
    searchQuery: '',
    isLoading: false,
  }),

  getters: {
    filteredNotes: (state) => {
      if (state.filterCategories.length === 0) {
        return state.notes;
      }
      return state.notes.filter(n => 
        n.category && state.filterCategories.includes(n.category)
      );
    },

    groupedByCategory: (state) => {
      const filtered = state.filterCategories.length === 0 
        ? state.notes 
        : state.notes.filter(n => n.category && state.filterCategories.includes(n.category));
      
      const groups = {};
      filtered.forEach(note => {
        const cat = note.category || '';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(note);
      });
      
      Object.keys(groups).forEach(cat => {
        groups[cat].sort((a, b) => a.order - b.order);
      });
      
      return groups;
    },

    getNoteById: (state) => (id) => {
      return state.notes.find(n => n.id === id);
    },
  },

  actions: {
    async loadNotes() {
      this.isLoading = true;
      try {
        this.notes = await getAllNotes();
        this.notes.sort((a, b) => a.order - b.order);
        this.categories = await getAllCategories();
        rebuildSearchIndex(this.notes);
      } finally {
        this.isLoading = false;
      }
    },

    async createNote(name = 'Untitled', category = '') {
      const maxOrder = this.notes.length > 0 
        ? Math.max(...this.notes.map(n => n.order)) + 1 
        : 0;
      
      const now = Date.now();
      const note = {
        id: generateId(),
        name,
        category,
        content: '',
        order: maxOrder,
        createdAt: now,
        updatedAt: now,
      };
      
      await addNote(note);
      await this.loadNotes();
      return note.id;
    },

    async saveNote(id, updates) {
      await updateNote(id, updates);
      await this.loadNotes();
    },

    async deleteNote(id) {
      await deleteNote(id);
      await this.loadNotes();
    },

    async importNotes(notes) {
      await bulkImport(notes);
      await this.loadNotes();
    },

    async exportNotes() {
      return JSON.stringify(this.notes, null, 2);
    },

    async updateNoteOrders(orderedNotes) {
      for (let i = 0; i < orderedNotes.length; i++) {
        await updateNote(orderedNotes[i].id, { order: i });
      }
      await this.loadNotes();
    },

    performSearch(query) {
      return search(query);
    },
  },
});
