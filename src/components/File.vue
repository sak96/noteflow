<template>
  <div class="file-view">
    <header class="header">
      <button @click="goHome" class="btn">Home</button>
      <div
        contenteditable
        ref="titleEl"
        class="title-input"
        @blur="updateTitle"
        @keydown.enter.prevent="$event.target.blur()"
      >{{ note?.name }}</div>
      <div class="header-actions">
        <button 
          @click="saveNote" 
          class="btn"
          :class="{ 'btn-dirty': isDirty }"
        >Save</button>
        <button @click="confirmDelete" class="btn btn-danger">Delete</button>
      </div>
    </header>

    <div ref="editorContainer" class="editor-container"></div>

    <dialog ref="deleteDialog" class="delete-dialog">
      <p>Delete this note?</p>
      <div class="dialog-actions">
        <button @click="deleteDialog.close()" class="btn">Cancel</button>
        <button @click="deleteNote" class="btn btn-danger">Delete</button>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Overtype from 'overtype';
import { useNotesStore } from '../stores/notes.js';
import { useRouter } from '../router.js';

const props = defineProps({
  id: { type: String, required: true },
});

const store = useNotesStore();
const router = useRouter();

const note = ref(null);
const titleEl = ref(null);
const editorContainer = ref(null);
const deleteDialog = ref(null);
const isDirty = ref(false);

let editor = null;

onMounted(async () => {
  await store.loadNotes();
  loadNote();
});

onUnmounted(() => {
  if (editor) {
    editor.destroy();
  }
});

watch(() => props.id, () => {
  loadNote();
});

function loadNote() {
  note.value = store.getNoteById(props.id);
  if (!note.value) {
    router.navigate('/');
    return;
  }
  
  if (editor) {
    editor.destroy();
  }
  
  [editor] = new Overtype(editorContainer.value, {
    value: note.value.content || '',
    showCursor: true,
    toolbar: true,
    onChange: (value, instance) => {
      isDirty.value = true;
    },
    style: {
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      tabSize: 2,
    },
  });
  
  isDirty.value = false;
}

function goHome() {
  router.navigate('/');
}

async function updateTitle() {
  const newName = titleEl.value.innerText.trim();
  if (newName && newName !== note.value.name) {
    await store.saveNote(props.id, { name: newName });
    note.value.name = newName;
  }
}

async function saveNote() {
  const content = editor.getValue();
  await store.saveNote(props.id, { content });
  isDirty.value = false;
}

function confirmDelete() {
  deleteDialog.value.showModal();
}

async function deleteNote() {
  deleteDialog.value.close();
  await store.deleteNote(props.id);
  router.navigate('/');
}

function insertFormat(prefix, suffix) {
  if (!editor) return;
  
  const selection = editor.state.selection;
  const selectedText = selection ? editor.getTextInRange(selection.start, selection.end) : '';
  
  if (selectedText) {
    editor.insertText(prefix + selectedText + suffix);
  } else {
    editor.insertText(prefix + suffix);
    editor.setSelection(editor.state.selection.start - suffix.length, editor.state.selection.start - suffix.length);
  }
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

.btn-dirty {
  border-color: var(--accent);
  color: var(--accent);
}

.editor-container {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 15px;
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
