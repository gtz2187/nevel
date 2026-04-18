<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">伏笔管理</div>
        <button class="primary" @click="newItem">+ 新建伏笔</button>
      </div>
      <button
        v-for="item in project.foreshadowing"
        :key="item.id"
        class="entity-item"
        :class="{ active: selected?.id === item.id }"
        @click="select(item.id)"
      >
        <div class="title-sm">{{ item.title }}</div>
        <div class="muted">{{ item.status }}</div>
      </button>
    </section>

    <section v-if="selected" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">伏笔编辑</div>
        <button class="primary" @click="save">保存</button>
      </div>
      <label class="field"><span class="muted">名称</span><input v-model="selected.title" /></label>
      <label class="field"><span class="muted">状态</span>
        <select v-model="selected.status">
          <option>未揭示</option>
          <option>已揭示</option>
          <option>已废弃</option>
        </select>
      </label>
      <label class="field"><span class="muted">详细描述</span><textarea v-model="selected.description" rows="8"></textarea></label>
      <div class="grid-2">
        <label class="field"><span class="muted">埋下章节 ID</span><input v-model="selected.plantedChapterId" /></label>
        <label class="field"><span class="muted">计划揭示章节 ID</span><input v-model="selected.plannedRevealChapterId" /></label>
      </div>
      <label class="field"><span class="muted">标签（逗号分隔）</span><input :value="selected.tags.join(', ')" @change="onTagsChange" /></label>
    </section>

    <div v-else class="empty-state">请选择或创建一个伏笔</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { ForeshadowingItem } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const selected = ref<ForeshadowingItem | null>(null);

function select(id: string) {
  const item = project.value?.foreshadowing.find((entry) => entry.id === id);
  selected.value = item ? JSON.parse(JSON.stringify(item)) : null;
}
function onTagsChange(event: Event) {
  if (!selected.value) return;
  selected.value.tags = (event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean);
}
async function save() {
  if (!selected.value) return;
  await store.saveForeshadowing(selected.value);
}
async function newItem() {
  await store.createForeshadowing({
    id: randomUUID(),
    title: '未命名伏笔',
    description: '',
    status: '未揭示',
    tags: []
  });
}
</script>

<style scoped>
.entity-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}
.entity-item {
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  padding: 12px;
  border-radius: 14px;
}
.entity-item.active {
  background: rgba(140, 128, 255, 0.22);
}
.field {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}
@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
}
</style>
