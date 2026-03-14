<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from './router.js';
import FileList from './components/FileList.vue';
import File from './components/File.vue';
import Search from './components/Search.vue';

const { currentComponent } = useRouter();

const component = computed(() => currentComponent.value.name);
const params = computed(() => currentComponent.value.params);
</script>

<template>
  <FileList v-if="component === 'FileList'" />
  <File v-else-if="component === 'File'" :id="params.id" />
  <Search v-else-if="component === 'Search'" />
  <FileList v-else />
</template>
