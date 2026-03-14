<template>
  <div class="filelist">
    <header class="header">
      <h1>Notes</h1>
      <div class="header-actions">
        <button @click="goToSearch" class="btn">Search</button>
        <button @click="exportNotes" class="btn">Export</button>
        <button @click="triggerImport" class="btn">Import</button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="importNotes"
        />
      </div>
    </header>

    <div class="filter-bar">
      <label>Filter by category:</label>
      <div class="category-filters">
        <label v-for="cat in store.categories" :key="cat" class="checkbox-label">
          <input
            type="checkbox"
            :value="cat"
            v-model="store.filterCategories"
          />
          {{ cat }}
        </label>
      </div>
    </div>

    <div class="add-form">
      <div
        contenteditable
        ref="newTitle"
        class="title-input"
        placeholder="New note title..."
        @keydown.enter.prevent="addNote"
      ></div>
      <input
        v-model="newCategory"
        list="categories"
        placeholder="Category"
        class="category-input"
      />
      <datalist id="categories">
        <option v-for="cat in store.categories" :key="cat" :value="cat" />
      </datalist>
      <button @click="addNote" class="btn btn-primary">Add</button>
    </div>

    <div class="notes-list">
      <div v-for="(notes, category) in store.groupedByCategory" :key="category" class="category-group">
        <h3 class="category-title">{{ category || 'Uncategorized' }}</h3>
        <draggable
          :list="notes"
          item-key="id"
          group="notes"
          @end="onDragEnd"
          class="draggable-list"
        >
          <template #item="{ element }">
            <div class="note-item" :data-id="element.id">
              <span
                contenteditable
                class="note-title"
                @blur="updateTitle(element.id, $event)"
                @keydown.enter.prevent="$event.target.blur()"
              >{{ element.name }}</span>
              <div class="note-actions">
                <button @click="goToFile(element.id)" class="btn btn-small">Go</button>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { VueDraggableNext as Draggable } from 'vue-draggable-next';
import { useNotesStore } from '../stores/notes.js';
import { useRouter } from '../router.js';

const store = useNotesStore();
const router = useRouter();

const newTitle = ref(null);
const newCategory = ref('');
const fileInput = ref(null);

onMounted(async () => {
  await store.loadNotes();
});

function goToSearch() {
  router.navigate('/search');
}

function goToFile(id) {
  router.navigate(`/file/${id}`);
}

async function addNote() {
  const title = newTitle.value.innerText.trim() || 'Untitled';
  const category = newCategory.value.trim();
  const id = await store.createNote(title, category);
  newTitle.value.innerText = '';
  newCategory.value = '';
  router.navigate(`/file/${id}`);
}

async function updateTitle(id, event) {
  const newName = event.target.innerText.trim();
  if (newName) {
    await store.saveNote(id, { name: newName });
  }
}

async function onDragEnd() {
  const orderedNotes = [];
  Object.values(store.groupedByCategory).forEach(notes => {
    notes.forEach(n => orderedNotes.push(n));
  });
  await store.updateNoteOrders(orderedNotes);
}

function triggerImport() {
  fileInput.value.click();
}

async function importNotes(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (confirm('This will overwrite all existing notes. Continue?')) {
    const text = await file.text();
    const notes = JSON.parse(text);
    await store.importNotes(notes);
  }
  event.target.value = '';
}

async function exportNotes() {
  const json = await store.exportNotes();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notes.json';
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.filelist {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.add-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.title-input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--fg);
  min-width: 0;
}

.title-input:empty::before {
  content: attr(placeholder);
  color: var(--fg-secondary);
}

.category-input {
  width: 150px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--fg);
}

.category-group {
  margin-bottom: 20px;
}

.category-title {
  font-size: 14px;
  color: var(--fg-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  cursor: grab;
}

.note-item:active {
  cursor: grabbing;
}

.note-title {
  flex: 1;
  outline: none;
  min-width: 0;
}

.note-actions {
  display: flex;
  gap: 8px;
}
</style>
