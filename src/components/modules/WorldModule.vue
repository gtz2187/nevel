<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">世界观词条</div>
        <button class="primary" @click="newEntry">+ 新建词条</button>
      </div>
      <button
        v-for="entry in project.worldEntries"
        :key="entry.id"
        class="entity-item"
        :class="{ active: selected?.id === entry.id }"
        @click="select(entry.id)"
      >
        <div class="title-sm">{{ entry.name }}</div>
        <div class="muted">{{ entry.categories.join(' / ') }}</div>
      </button>
    </section>

    <section v-if="selected" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">词条编辑器</div>
        <button class="primary" @click="save">保存词条</button>
      </div>
      <label class="field"><span class="muted">名称</span><input v-model="selected.name" /></label>
      <label class="field"><span class="muted">分类（逗号分隔）</span><input :value="selected.categories.join(', ')" @change="onCategoriesChange" /></label>
      <label class="field"><span class="muted">摘要</span><textarea v-model="selected.summary" rows="3"></textarea></label>
      <label class="field"><span class="muted">正文</span><textarea v-model="selected.content" rows="12"></textarea></label>
      <label class="field"><span class="muted">标签（逗号分隔）</span><input :value="selected.tags.join(', ')" @change="onTagsChange" /></label>
    </section>

    <div v-else class="empty-state">请选择或创建一个词条</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { WorldEntry } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const selected = ref<WorldEntry | null>(null);

function select(id: string) {
  const item = project.value?.worldEntries.find((entry) => entry.id === id);
  selected.value = item ? JSON.parse(JSON.stringify(item)) : null;
}

function onCategoriesChange(event: Event) {
  if (!selected.value) return;
  selected.value.categories = (event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean);
}

function onTagsChange(event: Event) {
  if (!selected.value) return;
  selected.value.tags = (event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean);
}

async function save() {
  if (!selected.value) return;
  await store.saveWorld(selected.value);
}

async function newEntry() {
  await store.createWorld({
    id: randomUUID(),
    name: '未命名词条',
    aliases: [],
    categories: ['未分类'],
    summary: '',
    content: '',
    linkedEntryIds: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
