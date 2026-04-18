<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">世界观词条</div>
        <button class="primary" @click="newEntry">+ 新建词条</button>
      </div>

      <input v-model="keyword" placeholder="搜索词条名 / 摘要" style="width:100%; margin-bottom:10px" />
      <select v-model="categoryFilter" style="width:100%; margin-bottom:10px">
        <option value="">全部分类</option>
        <option v-for="category in allCategories" :key="category" :value="category">{{ category }}</option>
      </select>

      <button
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="entity-item"
        :class="{ active: selected?.id === entry.id }"
        @click="select(entry.id)"
      >
        <div class="title-sm">{{ entry.name }}</div>
        <div class="muted">{{ entry.categories.join(' / ') || '未分类' }}</div>
      </button>
    </section>

    <section v-if="selected" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">词条编辑器</div>
        <button class="primary" @click="save">保存词条</button>
      </div>

      <div class="grid-2">
        <label class="field"><span class="muted">名称</span><input v-model="selected.name" /></label>
        <label class="field"><span class="muted">别名（逗号分隔）</span><input :value="selected.aliases.join(', ')" @change="onAliasesChange" /></label>
      </div>

      <label class="field"><span class="muted">分类（逗号分隔）</span><input :value="selected.categories.join(', ')" @change="onCategoriesChange" /></label>
      <label class="field"><span class="muted">摘要</span><textarea v-model="selected.summary" rows="3"></textarea></label>
      <label class="field"><span class="muted">正文</span><textarea v-model="selected.content" rows="12"></textarea></label>
      <label class="field"><span class="muted">标签（逗号分隔）</span><input :value="selected.tags.join(', ')" @change="onTagsChange" /></label>

      <div class="card card-pad" style="margin-top: 12px;">
        <div class="title-sm" style="margin-bottom: 8px;">关联词条</div>
        <div class="link-grid">
          <label v-for="entry in linkCandidates" :key="entry.id" class="row gap-8 muted">
            <input type="checkbox" :checked="selected.linkedEntryIds.includes(entry.id)" @change="toggleLink(entry.id)" />
            <span>{{ entry.name }}</span>
          </label>
        </div>
      </div>

      <div v-if="linkedEntries.length" class="card card-pad" style="margin-top: 12px;">
        <div class="title-sm" style="margin-bottom: 8px;">关联预览</div>
        <div class="chips">
          <span v-for="entry in linkedEntries" :key="entry.id" class="badge">{{ entry.name }}</span>
        </div>
      </div>

      <ModuleAIAssistant
        module-name="世界观"
        purpose="补全设定细节、统一规则并发现设定冲突"
        placeholder="例如：帮我扩展这个设定的社会影响和副作用"
        suggested-question="请检查当前词条是否和已有设定冲突，并给出可兼容的修订版本。"
      />
    </section>

    <div v-else class="empty-state">请选择或创建一个词条</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { WorldEntry } from '@shared/models';
import ModuleAIAssistant from './ModuleAIAssistant.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const selected = ref<WorldEntry | null>(null);
const keyword = ref('');
const categoryFilter = ref('');

watch(
  () => project.value?.worldEntries,
  (entries) => {
    if (!entries?.length) {
      selected.value = null;
      return;
    }
    if (!selected.value) {
      selected.value = deepClone(entries[0]);
      return;
    }
    const latest = entries.find((entry) => entry.id === selected.value?.id);
    if (latest) selected.value = deepClone(latest);
  },
  { immediate: true }
);

const allCategories = computed(() => {
  const set = new Set<string>();
  for (const entry of project.value?.worldEntries ?? []) {
    for (const category of entry.categories) {
      if (category.trim()) set.add(category.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'));
});

const filteredEntries = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  const category = categoryFilter.value.trim();
  return (project.value?.worldEntries ?? []).filter((entry) => {
    const hitKeyword = !q || [entry.name, entry.summary, entry.content].some((field) => field.toLowerCase().includes(q));
    const hitCategory = !category || entry.categories.includes(category);
    return hitKeyword && hitCategory;
  });
});

const linkCandidates = computed(() =>
  (project.value?.worldEntries ?? []).filter((entry) => entry.id !== selected.value?.id)
);

const linkedEntries = computed(() => {
  if (!selected.value) return [];
  const ids = new Set(selected.value.linkedEntryIds);
  return (project.value?.worldEntries ?? []).filter((entry) => ids.has(entry.id));
});

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function select(id: string) {
  const item = project.value?.worldEntries.find((entry) => entry.id === id);
  selected.value = item ? deepClone(item) : null;
}

function parseTags(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function onAliasesChange(event: Event) {
  if (!selected.value) return;
  selected.value.aliases = parseTags((event.target as HTMLInputElement).value);
}

function onCategoriesChange(event: Event) {
  if (!selected.value) return;
  selected.value.categories = parseTags((event.target as HTMLInputElement).value);
}

function onTagsChange(event: Event) {
  if (!selected.value) return;
  selected.value.tags = parseTags((event.target as HTMLInputElement).value);
}

function toggleLink(entryId: string) {
  if (!selected.value) return;
  const index = selected.value.linkedEntryIds.indexOf(entryId);
  if (index >= 0) selected.value.linkedEntryIds.splice(index, 1);
  else selected.value.linkedEntryIds.push(entryId);
}

async function save() {
  if (!selected.value) return;
  const payload: WorldEntry = {
    ...selected.value,
    name: selected.value.name.trim() || '未命名词条',
    summary: selected.value.summary.trim(),
    content: selected.value.content,
    aliases: selected.value.aliases.filter(Boolean),
    categories: selected.value.categories.length ? selected.value.categories : ['未分类'],
    tags: selected.value.tags.filter(Boolean),
    linkedEntryIds: Array.from(new Set(selected.value.linkedEntryIds))
  };
  await store.saveWorld(payload);
  selected.value = deepClone(payload);
}

async function newEntry() {
  const id = randomUUID();
  await store.createWorld({
    id,
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

  if (store.currentProject?.worldEntries.length) {
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
.link-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
  .link-grid { grid-template-columns: 1fr; }
}
</style>
