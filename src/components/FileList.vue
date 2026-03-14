<template>
  <div class="filelist">
    <header class="header">
      <h1>Notes</h1>
      <div class="header-actions">
        <button @click="goToSearch" class="btn">🔍</button>
        <button @click="exportNotes" class="btn">📤</button>
        <button @click="triggerImport" class="btn">📥</button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="importNotes"
        />
      </div>
    </header>

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
      <button @click="addNote" class="btn btn-primary">➕</button>
    </div>

    <div class="notes-list">
      <details
        v-for="(notes, category) in store.groupedByCategory"
        :key="category"
        class="category-group"
        open
      >
        <summary class="category-title">{{ category || 'Uncategorized' }}</summary>
        <draggable
          :list="notes"
          handle=".drag-handle"
          @end="onDragEnd"
          class="draggable-list"
        >
          <div v-for="element in notes" :key="element.id">
              <div class="note-item" :data-id="element.id">
                <span class="drag-handle">⠿</span>
                <span
                  contenteditable
                  class="note-title"
                  @blur="updateTitle(element.id, $event)"
                  @keydown.enter.prevent="$event.target.blur()"
                >{{ element.name }}</span>
                <button @click="goToFile(element.id)" class="btn btn-small">✏️</button>
              </div>
          </div>
        </draggable>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { VueDraggableNext as draggable } from 'vue-draggable-next';
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
  margin-bottom: 15px;
}

.category-title {
  font-size: 14px;
  color: var(--fg-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  cursor: pointer;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.drag-handle {
  cursor: grab;
  color: var(--fg-secondary);
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.note-item:active .drag-handle {
  cursor: grabbing;
}

.note-title {
  flex: 1;
  outline: none;
  min-width: 0;
}
</style>
