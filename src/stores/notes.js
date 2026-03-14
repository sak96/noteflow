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
      const groups = {};
      state.notes.forEach(note => {
        const rawCat = note.category || '';
        const catKey = rawCat.toLowerCase();
        if (!groups[catKey]) groups[catKey] = [];
        groups[catKey].push(note);
      });
      
      Object.keys(groups).forEach(catKey => {
        groups[catKey].sort((a, b) => a.order - b.order);
      });
      
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        const aEmpty = a === '';
        const bEmpty = b === '';
        if (aEmpty && !bEmpty) return 1;
        if (!aEmpty && bEmpty) return -1;
        return a.localeCompare(b);
      });
      
      const sortedGroups = {};
      sortedKeys.forEach(key => {
        const displayName = key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
        sortedGroups[displayName] = groups[key];
      });
      
      return sortedGroups;
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
