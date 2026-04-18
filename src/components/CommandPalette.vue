<template>
  <div v-if="open" class="overlay" @click.self="close">
    <div class="panel glass" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="runActive">
      <input
        ref="inputEl"
        v-model="keyword"
        :placeholder="isCommandMode ? '命令模式：输入命令关键词' : '搜索模块、章节、人物，或输入 > 命令'"
      />
      <div class="results">
        <button
          v-for="(item, index) in filtered"
          :key="item.id"
          class="result"
          :class="{ active: index === activeIndex }"
          @mouseenter="activeIndex = index"
          @click="run(item)"
        >
          <div class="title-sm">{{ item.title }}</div>
          <div class="muted">{{ item.group }} · {{ item.hint }}</div>
        </button>
        <div v-if="!filtered.length" class="muted empty">没有找到匹配项</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';

type PaletteItem = { id: string; title: string; group: string; hint: string; action: () => void };

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const store = useWorkspaceStore();
const keyword = ref('');
const inputEl = ref<HTMLInputElement | null>(null);
const activeIndex = ref(0);

const isCommandMode = computed(() => keyword.value.trimStart().startsWith('>'));

watch(
  () => props.open,
  async (value) => {
    if (!value) {
      keyword.value = '';
      activeIndex.value = 0;
      return;
    }
    await nextTick();
    inputEl.value?.focus();
  }
);

const filtered = computed(() => {
  const items: PaletteItem[] = [];
  const project = store.currentProject;

  if (project) {
    const moduleCommands: PaletteItem[] = [
      { id: 'dashboard', title: '打开仪表盘', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'dashboard') },
      { id: 'outline', title: '打开大纲', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'outline') },
      { id: 'characters', title: '打开人物库', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'characters') },
      { id: 'timeline', title: '打开时间线', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'timeline') },
      { id: 'world', title: '打开世界观', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'world') },
      { id: 'foreshadowing', title: '打开伏笔', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'foreshadowing') },
      { id: 'notes', title: '打开灵感便签板', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'notes') },
      { id: 'settings', title: '打开设置中心', group: '命令', hint: '模块切换', action: () => (store.currentModule = 'settings') },
      { id: 'focus', title: store.focusMode ? '关闭专注模式' : '开启专注模式', group: '命令', hint: '写作视图', action: () => (store.focusMode = !store.focusMode) },
      { id: 'ai', title: '打开 AI 助手', group: '命令', hint: '快速问答', action: () => (store.aiAssistantOpen = true) }
    ];

    const chapterEntries: PaletteItem[] = project.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      group: '章节',
      hint: `${chapter.status} · ${chapter.targetWords} 字`,
      action: () => store.selectChapter(chapter.id)
    }));

    const characterEntries: PaletteItem[] = project.characters.map((character) => ({
      id: character.id,
      title: character.name,
      group: '人物',
      hint: `${character.importance} · ${character.faction || '未设阵营'}`,
      action: () => (store.currentModule = 'characters')
    }));

    const worldEntries: PaletteItem[] = project.worldEntries.map((entry) => ({
      id: entry.id,
      title: entry.name,
      group: '世界观',
      hint: entry.categories.join(' / ') || '未分类',
      action: () => (store.currentModule = 'world')
    }));

    items.push(...moduleCommands, ...chapterEntries, ...characterEntries, ...worldEntries);
  }

  const source = isCommandMode.value ? items.filter((item) => item.group === '命令') : items;
  const q = (isCommandMode.value ? keyword.value.replace(/^\s*>\s*/, '') : keyword.value).trim().toLowerCase();
  if (!q) return source.slice(0, 24);
  return source
    .filter((item) => [item.title, item.group, item.hint].some((field) => field.toLowerCase().includes(q)))
    .slice(0, 24);
});

watch(filtered, (value) => {
  if (!value.length) activeIndex.value = 0;
  else activeIndex.value = Math.min(activeIndex.value, value.length - 1);
});

function move(offset: 1 | -1) {
  if (!filtered.value.length) return;
  const next = activeIndex.value + offset;
  if (next < 0) activeIndex.value = filtered.value.length - 1;
  else if (next >= filtered.value.length) activeIndex.value = 0;
  else activeIndex.value = next;
}

function runActive() {
  const item = filtered.value[activeIndex.value];
  if (item) run(item);
}

function close() {
  emit('close');
}

function run(item: PaletteItem) {
  item.action();
  emit('close');
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(21, 56, 33, 0.22);
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
  border: 1px solid transparent;
}
.result.active {
  border-color: rgba(82, 168, 107, 0.6);
  background: rgba(122, 203, 143, 0.26);
}
.empty {
  padding: 16px;
}
</style>
