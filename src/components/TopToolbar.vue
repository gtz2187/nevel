<template>
  <div class="toolbar glass">
    <div class="left">
      <div class="title-sm">{{ title }}</div>
      <div class="muted">{{ subtitle }}</div>
    </div>
    <div class="right">
      <button class="ghost" @click="store.commandPaletteOpen = true">⌘K 搜索</button>
      <button class="ghost" @click="store.createSnapshot()">创建快照</button>
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
</script>

<style scoped>
.toolbar {
  height: 72px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  margin-bottom: 16px;
  border: 1px solid rgba(56, 126, 84, 0.18);
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
