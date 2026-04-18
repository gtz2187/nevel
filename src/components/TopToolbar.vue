<template>
  <div class="toolbar glass">
    <div class="left">
      <div class="title-sm">{{ title }}</div>
      <div class="muted">{{ subtitle }}</div>
    </div>
    <div class="right">
      <button class="ghost" @click="store.commandPaletteOpen = true">⌘K 搜索</button>
      <button class="ghost" @click="store.createSnapshot()">创建快照</button>
      <button class="primary" @click="askAi">AI 助手</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';

const store = useWorkspaceStore();

const title = computed(() => {
  if (!store.currentProject) return '墨者';
  return `${store.currentProject.title} · 工作台`;
});

const subtitle = computed(() => {
  if (!store.currentProject) return '';
  return `总字数 ${store.currentProject.totalWords} · 已完成章节 ${store.currentProject.completedChapters}/${store.currentProject.plannedChapters}`;
});

async function askAi() {
  const question = prompt('问 AI：', '请概括当前第一卷的问题和机会');
  if (!question) return;
  await store.askAI(question);
  if (store.aiOutput) {
    alert(store.aiOutput);
  }
}
</script>

<style scoped>
.toolbar {
  height: 72px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  margin-bottom: 16px;
}
.left {
  display: grid;
  gap: 4px;
}
.right {
  display: flex;
  gap: 10px;
}
</style>
