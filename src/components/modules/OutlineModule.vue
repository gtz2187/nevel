<template>
  <div v-if="project" class="grid-2">
    <section class="card card-pad">
      <div class="row" style="justify-content:space-between; margin-bottom: 14px">
        <div class="title-md">大纲树</div>
        <div class="row gap-8">
          <button @click="expandAll = !expandAll" class="ghost">{{ expandAll ? '收起提示' : '展开提示' }}</button>
          <button class="primary" @click="addVolume">+ 新建卷</button>
        </div>
      </div>

      <ul class="tree list-reset">
        <OutlineNodeItem
          v-for="node in localOutline"
          :key="node.id"
          :node="node"
          @add-child="handleAddChild"
          @open-chapter="openChapter"
          @update-node="handleUpdateNode"
          @remove="removeNode"
          @move="moveNode"
        />
      </ul>

      <div class="row gap-12" style="margin-top:16px">
        <button class="primary" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存大纲' }}</button>
      </div>
    </section>

    <section class="card card-pad">
      <div class="title-md">大纲概览</div>
      <p class="muted">可直接编辑标题、状态、目标字数与摘要；支持节点新增、删除、同级内上移下移，并与章节编辑器联动。</p>

      <div class="card card-pad" style="margin-top: 16px">
        <div class="title-sm">当前规划</div>
        <div class="muted">卷数：{{ stats.volumeCount }}</div>
        <div class="muted">章节数：{{ stats.chapterCount }}</div>
        <div class="muted">分节数：{{ stats.sectionCount }}</div>
        <div class="muted">已完成章节：{{ completedChapterCount }}</div>
      </div>

      <div v-if="expandAll" class="card card-pad" style="margin-top: 12px;">
        <div class="title-sm">使用建议</div>
        <ul>
          <li>章节节点可直接点击“进入正文”快速生成/打开章节。</li>
          <li>推荐先维护卷与章节骨架，再补充分节和摘要。</li>
          <li>状态为“已完成”的章节会参与进度统计。</li>
        </ul>
      </div>

      <ModuleAIAssistant
        module-name="大纲"
        purpose="优化章节结构节奏，发现情节断层"
        placeholder="例如：请帮我把第一卷大纲压缩成更有节奏的 8 章"
        suggested-question="请评估当前大纲节奏，指出拖沓和缺失承接的位置，并给出重排建议。"
      />
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
import ModuleAIAssistant from './ModuleAIAssistant.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const localOutline = ref<OutlineNode[]>([]);
const saving = ref(false);
const expandAll = ref(false);

watch(
  () => project.value?.outline,
  (value) => {
    localOutline.value = JSON.parse(JSON.stringify(value ?? []));
  },
  { immediate: true }
);

const stats = computed(() => {
  const counters = { volumeCount: 0, chapterCount: 0, sectionCount: 0 };
  const walk = (nodes: OutlineNode[]) => {
    for (const node of nodes) {
      if (node.type === 'volume') counters.volumeCount += 1;
      if (node.type === 'chapter') counters.chapterCount += 1;
      if (node.type === 'section') counters.sectionCount += 1;
      walk(node.children);
    }
  };
  walk(localOutline.value);
  return counters;
});

const completedChapterCount = computed(() =>
  (project.value?.chapters ?? []).filter((item) => item.status === '已完成').length
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

function walkNodes<T>(
  nodes: OutlineNode[],
  handler: (node: OutlineNode, index: number, siblings: OutlineNode[]) => T | undefined
): T | undefined {
  for (let i = 0; i < nodes.length; i += 1) {
    const result = handler(nodes[i], i, nodes);
    if (result !== undefined) return result;
    const childResult = walkNodes(nodes[i].children, handler);
    if (childResult !== undefined) return childResult;
  }
  return undefined;
}

function addChild(parentId: string, type: OutlineNode['type']) {
  walkNodes(localOutline.value, (node) => {
    if (node.id !== parentId) return undefined;
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
  });
}

function handleAddChild(payload: { parentId: string; type: OutlineNode['type'] }) {
  addChild(payload.parentId, payload.type);
}

function handleUpdateNode(nextNode: OutlineNode) {
  walkNodes(localOutline.value, (node) => {
    if (node.id !== nextNode.id) return undefined;
    Object.assign(node, nextNode);
    return true;
  });
}

function removeNode(nodeId: string) {
  walkNodes(localOutline.value, (node, index, siblings) => {
    if (node.id !== nodeId) return undefined;
    siblings.splice(index, 1);
    return true;
  });
}

function moveNode(payload: { id: string; dir: -1 | 1 }) {
  walkNodes(localOutline.value, (node, index, siblings) => {
    if (node.id !== payload.id) return undefined;
    const target = index + payload.dir;
    if (target < 0 || target >= siblings.length) return true;
    const [item] = siblings.splice(index, 1);
    siblings.splice(target, 0, item);
    return true;
  });
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
  saving.value = true;
  try {
    await store.updateOutline(localOutline.value);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.tree {
  display: grid;
  gap: 12px;
}
ul {
  margin: 0;
  padding-left: 20px;
}
</style>
