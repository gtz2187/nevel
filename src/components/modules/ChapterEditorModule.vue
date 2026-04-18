<template>
  <div v-if="project && chapter" class="editor-grid">
    <section class="card card-pad">
      <div class="row" style="justify-content:space-between; margin-bottom:16px">
        <div>
          <div class="title-md">{{ chapter.title }}</div>
          <div class="muted">状态 {{ draft.status }} · 目标 {{ draft.targetWords }} 字 · 当前 {{ currentWords }} 字</div>
        </div>
        <div class="row gap-12">
          <button class="ghost" @click="mode = mode === 'edit' ? 'preview' : 'edit'">{{ mode === 'edit' ? '切预览' : '切编辑' }}</button>
          <button class="primary" @click="save">保存章节</button>
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
    </section>

    <section class="card card-pad side-col">
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
    </section>
  </div>
  <div v-else class="empty-state">请选择一个章节进入写作</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { markdownToHtml } from '@/lib/format';
import type { ChapterDocument } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const chapter = computed(() => store.currentChapter);
const mode = ref<'edit' | 'preview'>('edit');
const tagInput = ref('');
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
  },
  { immediate: true }
);

const currentWords = computed(() => Array.from(draft.markdown.replace(/\s/g, '')).length);
const html = computed(() => markdownToHtml(draft.markdown));

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
  await window.mozheDesktop?.notify('章节已保存', draft.title);
}
</script>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
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
@media (max-width: 1200px) {
  .editor-grid { grid-template-columns: 1fr; }
}
</style>
