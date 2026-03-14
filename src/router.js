import { reactive, computed } from 'vue';

const state = reactive({
  hash: window.location.hash.slice(1) || '/',
});

window.addEventListener('hashchange', () => {
  state.hash = window.location.hash.slice(1) || '/';
});

export function useRouter() {
  const currentComponent = computed(() => {
    const hash = state.hash;
    if (hash.startsWith('/file/')) {
      return { name: 'File', params: { id: hash.split('/')[2] } };
    }
    if (hash === '/search') {
      return { name: 'Search' };
    }
    return { name: 'FileList' };
  });

  const navigate = (path) => {
    window.location.hash = path;
  };

  return { currentComponent, navigate };
}
