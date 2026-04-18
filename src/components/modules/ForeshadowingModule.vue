<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">伏笔管理</div>
        <button class="primary" @click="newItem">+ 新建伏笔</button>
      </div>

      <div class="grid-2" style="margin-bottom: 10px;">
        <input v-model="keyword" placeholder="搜索伏笔" />
        <select v-model="statusFilter">
          <option value="">全部状态</option>
          <option>未揭示</option>
          <option>已揭示</option>
          <option>已废弃</option>
        </select>
      </div>

      <button
        v-for="item in filteredItems"
        :key="item.id"
        class="entity-item"
        :class="{ active: selected?.id === item.id }"
        @click="select(item.id)"
      >
        <div class="title-sm">{{ item.title }}</div>
        <div class="muted">{{ item.status }} · {{ chapterTitle(item.plantedChapterId) || '未设埋点' }}</div>
      </button>
    </section>

    <section v-if="selected" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">伏笔编辑</div>
        <button class="primary" :disabled="hasBlockingIssues" @click="save">{{ hasBlockingIssues ? '存在冲突，无法保存' : '保存' }}</button>
      </div>

      <label class="field"><span class="muted">名称</span><input v-model="selected.title" /></label>
      <div class="grid-2">
        <label class="field"><span class="muted">状态</span>
          <select v-model="selected.status">
            <option>未揭示</option>
            <option>已揭示</option>
            <option>已废弃</option>
          </select>
        </label>
        <label class="field"><span class="muted">标签（逗号分隔）</span><input :value="selected.tags.join(', ')" @change="onTagsChange" /></label>
      </div>

      <label class="field"><span class="muted">详细描述</span><textarea v-model="selected.description" rows="8"></textarea></label>

      <div class="grid-3">
        <label class="field"><span class="muted">埋下章节</span>
          <select v-model="selected.plantedChapterId">
            <option value="">未选择</option>
            <option v-for="chapter in project.chapters" :key="chapter.id" :value="chapter.id">{{ chapter.title }}</option>
          </select>
        </label>
        <label class="field"><span class="muted">计划揭示章节</span>
          <select v-model="selected.plannedRevealChapterId">
            <option value="">未选择</option>
            <option v-for="chapter in project.chapters" :key="chapter.id" :value="chapter.id">{{ chapter.title }}</option>
          </select>
        </label>
        <label class="field"><span class="muted">实际揭示章节</span>
          <select v-model="selected.actualRevealChapterId">
            <option value="">未选择</option>
            <option v-for="chapter in project.chapters" :key="chapter.id" :value="chapter.id">{{ chapter.title }}</option>
          </select>
        </label>
      </div>


      <div v-if="validationIssues.length" class="card card-pad warning-box" style="margin-top: 12px;">
        <div class="title-sm">一致性检查</div>
        <ul>
          <li v-for="issue in validationIssues" :key="issue.message">{{ issue.severity === 'error' ? '[错误] ' : '[提醒] ' }}{{ issue.message }}</li>
        </ul>
      </div>

      <div class="row gap-8" style="margin-top: 12px;">
        <button class="ghost" @click="markRevealedNow">标记为已揭示（当前章节）</button>
        <button class="ghost" @click="clearReveal">清除揭示状态</button>
      </div>
    </section>

    <section v-else class="empty-state">请选择或创建一个伏笔</section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { ForeshadowingItem } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const selected = ref<ForeshadowingItem | null>(null);
const keyword = ref('');
const statusFilter = ref('');

watch(
  () => project.value?.foreshadowing,
  (items) => {
    if (!items?.length) {
      selected.value = null;
      return;
    }
    if (!selected.value) {
      selected.value = deepClone(items[0]);
      return;
    }
    const latest = items.find((item) => item.id === selected.value?.id);
    if (latest) selected.value = deepClone(latest);
  },
  { immediate: true }
);


const chapterOrder = computed(() => {
  const map = new Map<string, number>();
  for (const [index, chapter] of (project.value?.chapters ?? []).entries()) {
    map.set(chapter.id, index);
  }
  return map;
});

const validationIssues = computed(() => {
  if (!selected.value) return [] as Array<{ message: string; severity: 'error' | 'warn' }>;
  const issues: Array<{ message: string; severity: 'error' | 'warn' }> = [];
  const order = chapterOrder.value;

  const planted = selected.value.plantedChapterId ? order.get(selected.value.plantedChapterId) : undefined;
  const planned = selected.value.plannedRevealChapterId ? order.get(selected.value.plannedRevealChapterId) : undefined;
  const actual = selected.value.actualRevealChapterId ? order.get(selected.value.actualRevealChapterId) : undefined;

  if (planted !== undefined && planned !== undefined && planned < planted) {
    issues.push({ message: '计划揭示章节早于埋下章节，建议调整顺序。', severity: 'error' });
  }
  if (planted !== undefined && actual !== undefined && actual < planted) {
    issues.push({ message: '实际揭示章节早于埋下章节，存在时间线冲突。', severity: 'error' });
  }
  if (selected.value.status === '已揭示' && !selected.value.actualRevealChapterId) {
    issues.push({ message: '状态为“已揭示”但未设置实际揭示章节。', severity: 'warn' });
  }
  if (selected.value.status !== '已揭示' && selected.value.actualRevealChapterId) {
    issues.push({ message: '已设置实际揭示章节，但状态不是“已揭示”。', severity: 'warn' });
  }
  return issues;
});

const hasBlockingIssues = computed(() => validationIssues.value.some((issue) => issue.severity === 'error'));

const filteredItems = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  const status = statusFilter.value;
  return (project.value?.foreshadowing ?? []).filter((item) => {
    const hitKeyword = !q || [item.title, item.description, ...item.tags].some((field) => field.toLowerCase().includes(q));
    const hitStatus = !status || item.status === status;
    return hitKeyword && hitStatus;
  });
});

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function chapterTitle(chapterId?: string) {
  if (!chapterId) return '';
  return project.value?.chapters.find((chapter) => chapter.id === chapterId)?.title ?? '';
}

function select(id: string) {
  const item = project.value?.foreshadowing.find((entry) => entry.id === id);
  selected.value = item ? deepClone(item) : null;
}

function onTagsChange(event: Event) {
  if (!selected.value) return;
  selected.value.tags = (event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean);
}

function markRevealedNow() {
  if (!selected.value) return;
  selected.value.status = '已揭示';
  selected.value.actualRevealChapterId = selected.value.actualRevealChapterId || store.selectedChapterId || undefined;
}

function clearReveal() {
  if (!selected.value) return;
  selected.value.status = '未揭示';
  selected.value.actualRevealChapterId = undefined;
}

async function save() {
  if (!selected.value) return;
  if (hasBlockingIssues.value) {
    await window.mozheDesktop?.notify('伏笔存在冲突', '请先修复一致性检查中的错误项');
    return;
  }
  const payload: ForeshadowingItem = {
    ...selected.value,
    title: selected.value.title.trim() || '未命名伏笔',
    description: selected.value.description.trim(),
    tags: selected.value.tags.filter(Boolean),
    plantedChapterId: selected.value.plantedChapterId || undefined,
    plannedRevealChapterId: selected.value.plannedRevealChapterId || undefined,
    actualRevealChapterId:
      selected.value.status === '已揭示'
        ? selected.value.actualRevealChapterId || selected.value.plannedRevealChapterId || undefined
        : undefined
  };
  await store.saveForeshadowing(payload);
  selected.value = deepClone(payload);
}

async function newItem() {
  const id = randomUUID();
  await store.createForeshadowing({
    id,
    title: '未命名伏笔',
    description: '',
    status: '未揭示',
    tags: []
  });

  if (store.currentProject?.foreshadowing.length) {
    select(id);
  }
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
.warning-box {
  border: 1px solid rgba(255, 202, 84, 0.35);
  background: rgba(255, 202, 84, 0.08);
}

@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
}
</style>
