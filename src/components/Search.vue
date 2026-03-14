<template>
  <div class="search-view">
    <header class="header">
      <button @click="goHome" class="btn">🏠</button>
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Search notes..."
        @input="performSearch"
        autofocus
      />
    </header>

    <div class="results">
      <div v-if="query && results.length === 0" class="no-results">
        No results found
      </div>
      <details
        v-for="result in results"
        :key="result.id"
        class="result-item"
        open
      >
        <summary class="result-summary">
          <span class="result-title">{{ result.name }}</span>
          <button @click.stop="goToFile(result.id)" class="btn btn-small">✎</button>
        </summary>
        <div class="result-content" v-html="getHighlightedContent(result)"></div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useNotesStore } from '../stores/notes.js';
import { useRouter } from '../router.js';

const store = useNotesStore();
const router = useRouter();

const query = ref('');
const results = ref([]);

onMounted(async () => {
  await store.loadNotes();
});

function performSearch() {
  if (!query.value.trim()) {
    results.value = [];
    return;
  }
  
  const searchResults = store.performSearch(query.value);
  results.value = searchResults.map(r => {
    const note = store.getNoteById(r.id);
    return note || { id: r.id, name: r.name, content: '' };
  });
}

function goHome() {
  router.navigate('/');
}

function goToFile(id) {
  router.navigate(`/file/${id}`);
}

function getHighlightedContent(result) {
  const note = store.getNoteById(result.id);
  if (!note || !note.content) return '';
  
  const content = note.content;
  const searchTerm = query.value.trim();
  
  if (!searchTerm) return escapeHtml(content.substring(0, 200));
  
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  const matched = content.match(regex);
  
  if (!matched) {
    return escapeHtml(content.substring(0, 200));
  }
  
  const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + searchTerm.length + 150);
  let snippet = content.substring(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  return escapeHtml(snippet).replace(
    new RegExp(`(${escapeRegex(escapeHtml(searchTerm))})`, 'gi'),
    '<mark>$1</mark>'
  );
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
</script>

<style scoped>
.search-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  font-size: 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--fg);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-results {
  text-align: center;
  color: var(--fg-secondary);
  padding: 40px;
}

.result-item {
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
}

.result-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
}

.result-title {
  font-weight: bold;
}

.result-content {
  padding: 0 12px 12px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-content :deep(mark) {
  background: var(--accent);
  color: var(--bg);
  padding: 0 2px;
  border-radius: 2px;
}
</style>
