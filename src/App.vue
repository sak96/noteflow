<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from './router';
import FileList from './components/FileList.vue';
import FileView from './components/FileView.vue';
import SearchView from './components/SearchView.vue';

const { currentComponent } = useRouter();

const component = computed(() => currentComponent.value.name);
const params = computed(() => currentComponent.value.params);
</script>

<template>
  <FileList v-if="component === 'FileList'" />
  <FileView v-else-if="component === 'File'" :id="params?.id ?? ''" />
  <SearchView v-else-if="component === 'Search'" />
  <FileList v-else />
</template>
