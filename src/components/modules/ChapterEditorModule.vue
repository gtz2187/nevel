<template>
  <div v-if="project && chapter" class="editor-grid" :class="{ focus: store.focusMode }">
    <section class="card card-pad" :class="{ full: store.focusMode }">
      <div class="row" style="justify-content:space-between; margin-bottom:16px">
        <div>
          <div class="title-md">{{ chapter.title }}</div>
          <div class="muted">状态 {{ draft.status }} · 目标 {{ draft.targetWords }} 字 · 当前 {{ currentWords }} 字</div>
        </div>
        <div class="row gap-12 editor-actions">
          <button class="ghost" @click="mode = mode === 'edit' ? 'preview' : 'edit'">{{ mode === 'edit' ? '切预览' : '切编辑' }}</button>
          <button class="ghost" @click="store.focusMode = !store.focusMode">{{ store.focusMode ? '退出专注' : '专注模式' }}</button>
          <button class="ghost" :disabled="extracting" @click="extract">{{ extracting ? '解析中...' : 'AI 解析本章' }}</button>
          <button class="primary" :disabled="store.saving" @click="save">{{ store.saving ? '保存中...' : '保存章节' }}</button>
        </div>
      </div>

      <input v-model="draft.title" placeholder="章节标题" style="width:100%; margin-bottom: 12px" />
      <div class="row gap-12" style="margin-bottom: 12px">
        <select v-model="draft.status">
          <option>规划中</option>
          <option>写作中</option>
          <option>待修改</option>
          <option>已完成</option>
          <option>已废弃</option>
        </select>
        <input v-model.number="draft.targetWords" type="number" placeholder="目标字数" />
      </div>

      <textarea
        v-if="mode === 'edit'"
        v-model="draft.markdown"
        class="editor-pane mono"
        :style="{ fontFamily: project.settings.editor.fontFamily, fontSize: `${project.settings.editor.fontSize}px`, lineHeight: String(project.settings.editor.lineHeight) }"
      ></textarea>
      <div v-else class="editor-pane markdown-preview" v-html="html"></div>
      <div class="muted autosave-tip">
        自动保存：每 {{ project.settings.editor.autoSaveSeconds }} 秒，检测内容变化后写入。
        <span v-if="autoSaving">（正在保存...）</span>
        <span v-else-if="lastAutoSaveAt">（上次自动保存 {{ lastAutoSaveAt }}）</span>
      </div>
    </section>

    <section v-if="!store.focusMode" class="card card-pad side-col">
      <div class="title-md">本章设定</div>
      <label class="field">
        <span class="muted">章节标签</span>
        <input v-model="tagInput" @keydown.enter.prevent="appendTag" placeholder="输入标签回车添加" />
      </label>
      <div class="row gap-8" style="flex-wrap:wrap">
        <span class="badge" v-for="tag in draft.tags" :key="tag">{{ tag }}</span>
      </div>

      <label class="field">
        <span class="muted">本章备注</span>
        <textarea v-model="draft.notes" rows="6"></textarea>
      </label>

      <div class="title-sm">出场人物</div>
      <div class="chips">
        <button
          v-for="character in project.characters"
          :key="character.id"
          :class="{ primary: draft.characterIds.includes(character.id) }"
          @click="toggleListItem(draft.characterIds, character.id)"
        >
          {{ character.name }}
        </button>
      </div>

      <div class="title-sm">发生地点</div>
      <div class="chips">
        <button
          v-for="entry in project.worldEntries"
          :key="entry.id"
          :class="{ primary: draft.locationIds.includes(entry.id) }"
          @click="toggleListItem(draft.locationIds, entry.id)"
        >
          {{ entry.name }}
        </button>
      </div>

      <div class="title-sm">待揭示伏笔</div>
      <div class="chips">
        <button
          v-for="item in project.foreshadowing"
          :key="item.id"
          :class="{ primary: draft.foreshadowingIds.includes(item.id) }"
          @click="toggleListItem(draft.foreshadowingIds, item.id)"
        >
          {{ item.title }}
        </button>
      </div>


      <div class="title-sm">涉及时间线事件</div>
      <div class="chips">
        <button
          v-for="event in flattenedTimelineEvents"
          :key="event.id"
          :class="{ primary: draft.timelineEventIds.includes(event.id) }"
          @click="toggleListItem(draft.timelineEventIds, event.id)"
        >
          {{ event.title }}
        </button>
      </div>


      <div v-if="selectedForeshadowingItems.length" class="card card-pad">
        <div class="title-sm">伏笔揭示状态</div>
        <label
          v-for="item in selectedForeshadowingItems"
          :key="item.id"
          class="row gap-8 muted"
          style="margin-top: 8px;"
        >
          <input
            type="checkbox"
            :checked="item.actualRevealChapterId === draft.id && item.status === '已揭示'"
            @change="toggleForeshadowingReveal(item.id, $event)"
          />
          <span>{{ item.title }}</span>
        </label>
      </div>

      <div v-if="extracted.length" class="card card-pad">
        <div class="title-sm">AI 识别到的新实体（{{ extracted.length }}）</div>
        <div class="extract-list">
          <div v-for="item in extracted" :key="`${item.type}-${item.name}`" class="extract-item">
            <div class="title-sm">{{ item.name }} <span class="badge">{{ item.type }}</span></div>
            <div class="muted">{{ item.excerpt }}</div>
            <div class="row gap-8" style="margin-top: 8px; flex-wrap: wrap;">
              <button @click="createFromExtract(item)">创建为档案</button>
              <button class="ghost" @click="dismissExtract(item)">忽略</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else class="empty-state">请选择一个章节进入写作</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { markdownToHtml } from '@/lib/format';
import { api } from '@/lib/api';
import { randomUUID } from '@/utils/uuid';
import type { ChapterDocument } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const chapter = computed(() => store.currentChapter);
const mode = ref<'edit' | 'preview'>('edit');
const tagInput = ref('');
const extracting = ref(false);
const extracted = ref<Array<{ name: string; type: string; excerpt: string }>>([]);
const autoSaving = ref(false);
const lastAutoSaveAt = ref('');
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
let lastSavedSignature = '';

const draft = reactive<ChapterDocument>({
  id: '',
  title: '',
  status: '规划中',
  targetWords: 3000,
  markdown: '',
  tags: [],
  characterIds: [],
  locationIds: [],
  timelineEventIds: [],
  foreshadowingIds: [],
  notes: '',
  createdAt: '',
  updatedAt: '',
  versions: []
});

watch(
  chapter,
  (value) => {
    if (!value) return;
    Object.assign(draft, JSON.parse(JSON.stringify(value)));
    lastSavedSignature = chapterSignature();
  },
  { immediate: true }
);

watch(
  () => project.value?.settings.editor.autoSaveSeconds,
  () => startAutoSave(),
  { immediate: true }
);

const currentWords = computed(() => Array.from(draft.markdown.replace(/\s/g, '')).length);
const html = computed(() => markdownToHtml(draft.markdown));
const flattenedTimelineEvents = computed(() =>
  (project.value?.timelines ?? []).flatMap((timeline) => timeline.events.map((event) => ({ ...event, timelineName: timeline.name })))
);
const selectedForeshadowingItems = computed(() =>
  (project.value?.foreshadowing ?? []).filter((item) => draft.foreshadowingIds.includes(item.id))
);

function chapterSignature() {
  return JSON.stringify({
    id: draft.id,
    title: draft.title,
    status: draft.status,
    targetWords: draft.targetWords,
    markdown: draft.markdown,
    tags: draft.tags,
    characterIds: draft.characterIds,
    locationIds: draft.locationIds,
    timelineEventIds: draft.timelineEventIds,
    foreshadowingIds: draft.foreshadowingIds,
    notes: draft.notes
  });
}

function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  const seconds = Math.max(10, Number(project.value?.settings.editor.autoSaveSeconds ?? 30));
  autoSaveTimer = setInterval(async () => {
    if (!project.value || !draft.id || store.saving || autoSaving.value) return;
    const signature = chapterSignature();
    if (signature === lastSavedSignature) return;
    autoSaving.value = true;
    try {
      await store.saveChapter({ ...draft });
      lastSavedSignature = signature;
      lastAutoSaveAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } finally {
      autoSaving.value = false;
    }
  }, seconds * 1000);
}

onBeforeUnmount(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

function appendTag() {
  const next = tagInput.value.trim();
  if (!next) return;
  if (!draft.tags.includes(next)) draft.tags.push(next);
  tagInput.value = '';
}

function toggleListItem(list: string[], value: string) {
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
  else list.push(value);
}

async function save() {
  await store.saveChapter({ ...draft });
  lastSavedSignature = chapterSignature();
  await window.mozheDesktop?.notify('章节已保存', draft.title);
}


async function toggleForeshadowingReveal(itemId: string, event: Event) {
  if (!project.value) return;
  const item = project.value.foreshadowing.find((entry) => entry.id === itemId);
  if (!item) return;
  const checked = (event.target as HTMLInputElement).checked;
  await store.saveForeshadowing({
    ...item,
    status: checked ? '已揭示' : '未揭示',
    actualRevealChapterId: checked ? draft.id : undefined
  });
}

async function extract() {
  if (!project.value || !draft.id) return;
  extracting.value = true;
  try {
    const result = await api.extractEntities({
      projectId: project.value.id,
      chapterId: draft.id,
      content: draft.markdown
    });
    extracted.value = result.items;
    if (result.items.length) {
      await window.mozheDesktop?.notify('AI 解析完成', `发现 ${result.items.length} 个候选实体`);
    }
  } finally {
    extracting.value = false;
  }
}

async function createFromExtract(item: { name: string; type: string; excerpt: string }) {
  if (!project.value) return;
  if (['人物', 'character', 'CHARACTER'].includes(item.type)) {
    await store.createCharacter({
      id: randomUUID(),
      name: item.name,
      gender: '未知',
      age: '',
      race: '',
      occupation: '',
      faction: '',
      importance: '次要配角',
      appearance: '',
      background: item.excerpt,
      personalityTags: [],
      skills: [],
      relationships: [],
      notes: `由 AI 章节解析创建：${item.excerpt}`,
      aliases: [],
      appearanceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } else {
    await store.createWorld({
      id: randomUUID(),
      name: item.name,
      aliases: [],
      categories: item.type.includes('地点') ? ['地理/国家'] : ['组织/势力'],
      summary: item.excerpt.slice(0, 80),
      content: item.excerpt,
      linkedEntryIds: [],
      tags: ['AI解析'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  dismissExtract(item);
}

function dismissExtract(item: { name: string; type: string }) {
  extracted.value = extracted.value.filter((entry) => !(entry.name === item.name && entry.type === item.type));
}
</script>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
}
.editor-grid.focus {
  grid-template-columns: 1fr;
}
.card.full {
  min-height: calc(100vh - 220px);
}
.editor-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.side-col {
  display: grid;
  gap: 14px;
  align-content: start;
}
.field {
  display: grid;
  gap: 8px;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.extract-list {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}
.extract-item {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  padding: 10px;
}
.autosave-tip {
  margin-top: 10px;
}
@media (max-width: 1200px) {
  .editor-grid { grid-template-columns: 1fr; }
}
</style>
