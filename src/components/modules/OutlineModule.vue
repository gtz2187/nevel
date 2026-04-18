<template>
  <div v-if="project" class="grid-2">
    <section class="card card-pad">
      <div class="row" style="justify-content:space-between; margin-bottom: 14px">
        <div class="title-md">大纲树</div>
        <button class="primary" @click="addVolume">+ 新建卷</button>
      </div>
      <ul class="tree list-reset">
        <OutlineNodeItem
          v-for="node in localOutline"
          :key="node.id"
          :node="node"
          @add-child="handleAddChild"
          @open-chapter="openChapter"
        />
      </ul>
      <div class="row gap-12" style="margin-top:16px">
        <button class="primary" @click="save">保存大纲</button>
      </div>
    </section>

    <section class="card card-pad">
      <div class="title-md">大纲说明</div>
      <p class="muted">这一版先把卷-章-节数据结构、本地保存和章节联动落下来了。后续可继续加拖拽排序、颜色标签、转正文、章节卡片墙等。</p>
      <div class="card card-pad" style="margin-top: 16px">
        <div class="title-sm">当前规划</div>
        <div class="muted">章节总数：{{ project.plannedChapters }}</div>
        <div class="muted">已完成：{{ project.completedChapters }}</div>
      </div>
    </section>
  </div>
  <div v-else class="empty-state">未加载项目</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { randomUUID } from '@/utils/uuid';
import { useWorkspaceStore } from '@/stores/workspace';
import type { OutlineNode } from '@shared/models';
import OutlineNodeItem from './OutlineNodeItem.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const localOutline = ref<OutlineNode[]>([]);

watch(
  () => project.value?.outline,
  (value) => {
    localOutline.value = JSON.parse(JSON.stringify(value ?? []));
  },
  { immediate: true }
);

function addVolume() {
  localOutline.value.push({
    id: randomUUID(),
    type: 'volume',
    title: `第${localOutline.value.length + 1}卷：未命名`,
    status: '规划中',
    targetWords: 50000,
    summary: '',
    children: []
  });
}

function addChild(parentId: string, type: OutlineNode['type']) {
  const walk = (nodes: OutlineNode[]) => {
    for (const node of nodes) {
      if (node.id === parentId) {
        node.children.push({
          id: randomUUID(),
          type,
          title: type === 'chapter' ? `新章节` : '新分节',
          status: '规划中',
          targetWords: type === 'chapter' ? 3000 : 1200,
          summary: '',
          children: []
        });
        return true;
      }
      if (walk(node.children)) return true;
    }
    return false;
  };
  walk(localOutline.value);
}

function handleAddChild(payload: { parentId: string; type: OutlineNode['type'] }) {
  addChild(payload.parentId, payload.type);
}

function openChapter(node: OutlineNode) {
  if (!store.currentProject) return;
  const chapter = store.currentProject.chapters.find((item) => item.outlineNodeId === node.id);
  if (chapter) {
    store.selectChapter(chapter.id);
    return;
  }
  void store.createChapter({
    title: node.title,
    outlineNodeId: node.id,
    status: node.status,
    targetWords: node.targetWords
  });
}

async function save() {
  if (!store.currentProject) return;
  await fetch(`http://127.0.0.1:3777/api/projects/${store.currentProject.id}/outline`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(localOutline.value)
  });
  await store.openProject(store.currentProject.id);
}
</script>

<style scoped>
.tree {
  display: grid;
  gap: 12px;
}
</style>
