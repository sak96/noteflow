<template>
  <div class="file-view">
    <header class="header">
      <button @click="goHome" class="btn">🏠</button>
      <div
        contenteditable
        ref="titleEl"
        class="title-input"
        @blur="updateTitle"
        @keydown.enter.prevent="blurTarget"
      >{{ note?.name }}</div>
      <div class="header-actions">
        <button @click="confirmDelete" class="btn btn-danger">🗑️</button>
      </div>
    </header>

    <div ref="editorContainer" class="editor-container"></div>

    <dialog ref="deleteDialog" class="delete-dialog">
      <p>Delete this note?</p>
      <div class="dialog-actions">
        <button @click="closeDeleteDialog" class="btn">Cancel</button>
        <button @click="deleteNote" class="btn btn-danger">Delete</button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Overtype from 'overtype';
import { useNotesStore } from '../stores/notes';
import { useRouter } from '../router';
import type { Note } from '../types/index';

const props = defineProps<{
  id: string;
}>();

const store = useNotesStore();
const router = useRouter();

const note = ref<Note | null>(null);
const titleEl = ref<HTMLElement | null>(null);
const editorContainer = ref<HTMLElement | null>(null);
const deleteDialog = ref<HTMLDialogElement | null>(null);
const saveTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const AUTOSAVE_DELAY = 3000;

let editor: InstanceType<typeof Overtype> | null = null;

function getEditorTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'cave' : 'solar';
}

onMounted(async () => {
  await store.loadNotes();
  loadNote();
});

onUnmounted(() => {
  if (editor && editor.length > 0) {
    editor[0].destroy();
  }
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
    saveNote();
  }
});

watch(() => props.id, () => {
  loadNote();
});

function loadNote() {
  note.value = store.getNoteById(props.id) || null;
  if (!note.value) {
    router.navigate('/');
    return;
  }
  
  if (editor && editor.length > 0) {
    editor[0].destroy();
  }
  
  if (editorContainer.value) {
    const instances = new Overtype(editorContainer.value, {
      value: note.value.content || '',
      toolbar: true,
      theme: getEditorTheme(),
      onChange: () => {
        if (saveTimeout.value) {
          clearTimeout(saveTimeout.value);
        }
        saveTimeout.value = setTimeout(() => {
          saveNote();
        }, AUTOSAVE_DELAY);
      },
      spellcheck: true,
      showStats: true,
    });
    editor = instances;
  }
}

function goHome() {
  router.navigate('/');
}

async function updateTitle() {
  const newName = titleEl.value?.innerText?.trim();
  if (newName && note.value && newName !== note.value.name) {
    await store.saveNote(props.id, { name: newName });
    note.value.name = newName;
  }
}

async function saveNote() {
  const content = editor?.[0]?.getValue() || '';
  await store.saveNote(props.id, { content });
}

function confirmDelete() {
  deleteDialog.value?.showModal();
}

async function deleteNote() {
  deleteDialog.value?.close();
  await store.deleteNote(props.id);
  router.navigate('/');
}

function blurTarget(event: KeyboardEvent) {
  (event.target as HTMLElement)?.blur();
}

function closeDeleteDialog() {
  deleteDialog.value?.close();
}
</script>

<style scoped>
.file-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.title-input {
  flex: 1;
  font-size: 20px;
  font-weight: bold;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  outline: none;
  min-width: 0;
}

.title-input:focus {
  border-color: var(--border);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.editor-container {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: auto;
  background: var(--bg);
}

.delete-dialog {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  background: var(--bg);
  color: var(--fg);
}

.delete-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
}
</style>
