<template>
  <div class="filelist">
    <header class="header">
      <h1>Notes</h1>
      <div class="header-actions">
        <button @click="goToSearch" class="btn">🔍</button>
        <button @click="exportNotes" class="btn">📥</button>
        <button @click="triggerImport" class="btn">📤</button>
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
      <button @click="addNote" class="btn btn-primary" title="Add Note">📝</button>
      <button @click="addDivider" class="btn btn-primary" title="Add Divider">📂</button>
    </div>

    <div class="notes-list">
      <draggable
        :list="store.flatListItems"
        handle=".drag-handle"
        @end="onDragEnd"
        class="draggable-list"
      >
        <div
          v-for="item in store.flatListItems"
          :key="item.id"
          :class="isDivider(item) ? 'divider-item' : 'note-item'"
          :data-id="item.id"
          v-show="isItemVisible(item)"
        >
          <template v-if="isDivider(item)">
            <div class="divider-content" @click="toggleFold(item.id)">
              <span class="fold-toggle">{{ isFolded(item.id) ? '📁' : '📂' }}</span>
              <span class="divider-name">{{ item.name }}</span>
            </div>
            <span v-if="!isFolded(item.id)" class="drag-handle">⠿</span>
          </template>
          <template v-else>
            <span class="drag-handle">⠿</span>
            <span
              contenteditable
              class="note-title"
              @blur="updateTitle(item.id, $event)"
              @keydown.enter.prevent="blurTarget"
            >{{ item.name }}</span>
            <button @click="goToFile(item.id)" class="btn btn-small">✏️</button>
          </template>
        </div>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { VueDraggableNext as draggable } from 'vue-draggable-next';
import { useNotesStore } from '../stores/notes';
import { useRouter } from '../router';
import type { Note } from '../types/index';
import { isDivider } from '../types/index';

const store = useNotesStore();
const router = useRouter();

const newTitle = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const folded = ref<Map<string, boolean>>(new Map());

onMounted(async () => {
  await store.loadNotes();
});

function goToSearch() {
  router.navigate('/search');
}

function goToFile(id: string) {
  router.navigate(`/file/${id}`);
}

async function addNote() {
  const title = newTitle.value?.innerText?.trim() || 'Untitled';
  const id = await store.createNote(title);
  if (newTitle.value) newTitle.value.innerText = '';
  router.navigate(`/file/${id}`);
}

async function addDivider() {
  const title = newTitle.value?.innerText?.trim() || 'New Section';
  await store.createDivider(title);
  if (newTitle.value) newTitle.value.innerText = '';
}

async function updateTitle(id: string, event: FocusEvent) {
  const target = event.target as HTMLElement;
  const newName = target.innerText.trim();
  if (newName) {
    await store.saveNote(id, { name: newName });
  }
}

async function onDragEnd() {
  await store.updateNoteOrders(store.flatListItems);
}

function toggleFold(id: string) {
  const newFolded = new Map(folded.value);
  newFolded.set(id, !newFolded.get(id));
  folded.value = newFolded;
}

function isFolded(id: string): boolean {
  return folded.value.get(id) || false;
}

function isItemVisible(item: Note): boolean {
  if (isDivider(item)) return true;
  
  const items = store.flatListItems;
  const noteIndex = items.findIndex(i => i.id === item.id);
  
  for (let i = noteIndex - 1; i >= 0; i--) {
    if (isDivider(items[i])) {
      return !isFolded(items[i].id);
    }
  }
  return true;
}

function triggerImport() {
  fileInput.value?.click();
}

async function importNotes(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  if (confirm('This will overwrite all existing notes. Continue?')) {
    const text = await file.text();
    const notes = JSON.parse(text);
    await store.importNotes(notes);
  }
  target.value = '';
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

function blurTarget(event: KeyboardEvent) {
  (event.target as HTMLElement)?.blur();
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

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.divider-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.divider-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fold-toggle {
  font-size: 16px;
  color: var(--fg-secondary);
}

.divider-name {
  font-weight: 600;
  color: var(--fg-secondary);
  text-transform: uppercase;
  font-size: 12px;
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

.note-item .btn-small {
  border: none;
  padding: 4px;
  background: transparent;
}
</style>
