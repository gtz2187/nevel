<template>
  <div v-if="open" class="overlay" @click.self="close">
    <div class="panel glass">
      <input v-model="keyword" placeholder="搜索模块、章节、人物，或输入 > 命令" />
      <div class="results">
        <button
          v-for="item in filtered"
          :key="item.id"
          class="result"
          @click="run(item)"
        >
          <div class="title-sm">{{ item.title }}</div>
          <div class="muted">{{ item.group }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const store = useWorkspaceStore();
const router = useRouter();
const keyword = ref('');

watch(
  () => props.open,
  (value) => {
    if (!value) keyword.value = '';
  }
);

const filtered = computed(() => {
  const items: Array<{ id: string; title: string; group: string; action: () => void }> = [];
  if (store.currentProject) {
    items.push(
      { id: 'dashboard', title: '打开仪表盘', group: '命令', action: () => (store.currentModule = 'dashboard') },
      { id: 'outline', title: '打开大纲', group: '命令', action: () => (store.currentModule = 'outline') },
      { id: 'characters', title: '打开人物库', group: '命令', action: () => (store.currentModule = 'characters') },
      { id: 'timeline', title: '打开时间线', group: '命令', action: () => (store.currentModule = 'timeline') },
      { id: 'world', title: '打开世界观', group: '命令', action: () => (store.currentModule = 'world') }
    );
    for (const chapter of store.currentProject.chapters) {
      items.push({
        id: chapter.id,
        title: chapter.title,
        group: '章节',
        action: () => store.selectChapter(chapter.id)
      });
    }
    for (const character of store.currentProject.characters) {
      items.push({
        id: character.id,
        title: character.name,
        group: '人物',
        action: () => (store.currentModule = 'characters')
      });
    }
  }
  const q = keyword.value.trim().toLowerCase();
  if (!q) return items.slice(0, 18);
  return items.filter((item) => item.title.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)).slice(0, 18);
});

function close() {
  emit('close');
}

function run(item: { action: () => void }) {
  item.action();
  emit('close');
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 14, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
}
.panel {
  width: min(780px, calc(100vw - 40px));
  border-radius: 24px;
  padding: 16px;
}
.panel input {
  width: 100%;
  height: 52px;
  margin-bottom: 14px;
  font-size: 16px;
}
.results {
  display: grid;
  gap: 8px;
  max-height: 430px;
  overflow-y: auto;
}
.result {
  text-align: left;
  border-radius: 16px;
  padding: 14px;
}
</style>
