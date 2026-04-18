<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">时间线</div>
        <button class="primary" @click="newTimeline">+ 新建时间线</button>
      </div>

      <input v-model="timelineKeyword" placeholder="搜索时间线" style="width: 100%; margin-bottom: 10px;" />

      <button
        v-for="timeline in filteredTimelines"
        :key="timeline.id"
        class="entity-item"
        :class="{ active: selected?.id === timeline.id }"
        @click="select(timeline.id)"
      >
        <div class="title-sm">{{ timeline.name }}</div>
        <div class="muted">{{ timeline.events.length }} 个事件 · {{ timeline.isPrimary ? '主时间线' : '普通时间线' }}</div>
      </button>
    </section>

    <section v-if="selected" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px; flex-wrap: wrap; gap: 10px;">
        <div class="title-md">时间线编辑</div>
        <div class="row gap-8">
          <button :class="['ghost', { primary: viewMode === 'edit' }]" @click="viewMode = 'edit'">编辑模式</button>
          <button :class="['ghost', { primary: viewMode === 'axis' }]" @click="viewMode = 'axis'">时间轴预览</button>
          <button @click="addEvent">+ 事件</button>
          <button class="primary" @click="save">保存时间线</button>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 12px;">
        <label class="field"><span class="muted">名称</span><input v-model="selected.name" /></label>
        <label class="field"><span class="muted">颜色</span><input v-model="selected.color" type="color" /></label>
      </div>
      <label class="field"><span class="muted">说明</span><textarea v-model="selected.description" rows="3"></textarea></label>
      <label class="row gap-8 muted" style="margin-bottom:12px;">
        <input type="checkbox" v-model="selected.isPrimary" />
        设为主时间线（保存后生效）
      </label>

      <div v-if="viewMode === 'edit'">
        <input v-model="eventKeyword" placeholder="搜索事件标题 / 描述" style="width: 100%; margin-bottom: 12px;" />
        <div class="events">
          <div class="event card card-pad" v-for="(event, index) in filteredEvents" :key="event.id">
            <div class="row" style="justify-content:space-between; margin-bottom: 8px;">
              <div class="title-sm">事件 {{ index + 1 }}</div>
              <div class="row gap-8">
                <button class="ghost" @click="moveEvent(event.id, -1)">上移</button>
                <button class="ghost" @click="moveEvent(event.id, 1)">下移</button>
                <button class="danger" @click="removeEvent(event.id)">删除</button>
              </div>
            </div>

            <input v-model="event.title" placeholder="事件名" />
            <div class="grid-2" style="margin-top:10px">
              <input v-model="event.at" placeholder="发生时间（自由格式）" />
              <input v-model="event.endAt" placeholder="结束时间（可选）" />
            </div>
            <div class="grid-2" style="margin-top:10px">
              <select v-model="event.type">
                <option>剧情事件</option>
                <option>背景大事件</option>
                <option>人物个人事件</option>
              </select>
              <input :value="event.tags.join(', ')" placeholder="标签（逗号分隔）" @change="onTagsChange($event, event.id)" />
            </div>

            <textarea v-model="event.description" rows="3" style="margin-top:10px"></textarea>

            <div class="grid-3" style="margin-top:10px;">
              <label class="field compact">
                <span class="muted">涉及人物</span>
                <select multiple size="4" :value="event.characterIds" @change="onMultiSelect($event, event.id, 'characterIds')">
                  <option v-for="character in project.characters" :key="character.id" :value="character.id">{{ character.name }}</option>
                </select>
              </label>
              <label class="field compact">
                <span class="muted">发生地点</span>
                <select multiple size="4" :value="event.placeIds" @change="onMultiSelect($event, event.id, 'placeIds')">
                  <option v-for="place in project.worldEntries" :key="place.id" :value="place.id">{{ place.name }}</option>
                </select>
              </label>
              <label class="field compact">
                <span class="muted">关联章节</span>
                <select multiple size="4" :value="event.chapterIds" @change="onMultiSelect($event, event.id, 'chapterIds')">
                  <option v-for="chapter in project.chapters" :key="chapter.id" :value="chapter.id">{{ chapter.title }}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="axis-view">
        <div class="axis-line"></div>
        <div
          class="axis-item"
          v-for="(event, index) in sortedEvents"
          :key="event.id"
          :class="{ right: index % 2 === 1 }"
        >
          <div class="event-dot" :style="{ background: selected.color || '#7c8cff' }"></div>
          <div class="card card-pad axis-card">
            <div class="title-sm">{{ event.title || '未命名事件' }}</div>
            <div class="muted">{{ event.at || '未填写时间' }} {{ event.endAt ? `→ ${event.endAt}` : '' }}</div>
            <div class="muted">{{ event.type }}</div>
            <div class="muted one-line">{{ event.description || '暂无描述' }}</div>
          </div>
        </div>
      </div>

      <ModuleAIAssistant
        module-name="时间线"
        purpose="检查事件前后逻辑与时间冲突，并优化节奏"
        placeholder="例如：帮我找出这条时间线里可能矛盾的地方"
        suggested-question="请检查当前时间线事件的顺序是否合理，并指出潜在冲突和修复方案。"
      />
    </section>

    <div v-else class="empty-state">请选择或创建一条时间线</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { TimelineData, TimelineEvent } from '@shared/models';
import ModuleAIAssistant from './ModuleAIAssistant.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const selected = ref<TimelineData | null>(null);
const timelineKeyword = ref('');
const eventKeyword = ref('');
const viewMode = ref<'edit' | 'axis'>('edit');

watch(
  () => project.value?.timelines,
  (timelines) => {
    if (!timelines?.length) {
      selected.value = null;
      return;
    }

    if (!selected.value) {
      selected.value = deepClone(timelines[0]);
      return;
    }

    const latest = timelines.find((item) => item.id === selected.value?.id);
    if (latest) {
      selected.value = deepClone(latest);
    }
  },
  { immediate: true }
);

const filteredTimelines = computed(() => {
  const q = timelineKeyword.value.trim().toLowerCase();
  return (project.value?.timelines ?? []).filter((timeline) => !q || timeline.name.toLowerCase().includes(q));
});

const filteredEvents = computed(() => {
  if (!selected.value) return [];
  const q = eventKeyword.value.trim().toLowerCase();
  if (!q) return selected.value.events;
  return selected.value.events.filter((event) => [event.title, event.description, event.at, event.type].some((field) => (field ?? '').toLowerCase().includes(q)));
});

const sortedEvents = computed(() => {
  if (!selected.value) return [];
  return [...selected.value.events].sort((a, b) => (a.at || '').localeCompare(b.at || ''));
});

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function select(id: string) {
  const item = project.value?.timelines.find((timeline) => timeline.id === id);
  selected.value = item ? deepClone(item) : null;
}

function addEvent() {
  if (!selected.value) return;
  selected.value.events.push({
    id: randomUUID(),
    title: '未命名事件',
    at: '',
    endAt: '',
    type: '剧情事件',
    description: '',
    characterIds: [],
    placeIds: [],
    chapterIds: [],
    previousEventIds: [],
    nextEventIds: [],
    tags: []
  });
}

function removeEvent(eventId: string) {
  if (!selected.value) return;
  selected.value.events = selected.value.events.filter((event) => event.id !== eventId);
}

function moveEvent(eventId: string, offset: -1 | 1) {
  if (!selected.value) return;
  const list = selected.value.events;
  const index = list.findIndex((event) => event.id === eventId);
  if (index < 0) return;
  const target = index + offset;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

function onTagsChange(event: Event, eventId: string) {
  const target = selected.value?.events.find((item) => item.id === eventId);
  if (!target) return;
  const value = (event.target as HTMLInputElement).value;
  target.tags = value.split(',').map((item) => item.trim()).filter(Boolean);
}

function onMultiSelect(event: Event, eventId: string, field: 'characterIds' | 'placeIds' | 'chapterIds') {
  const target = selected.value?.events.find((item) => item.id === eventId);
  if (!target) return;
  const options = Array.from((event.target as HTMLSelectElement).selectedOptions);
  target[field] = options.map((option) => option.value);
}

async function save() {
  if (!selected.value || !project.value) return;

  if (selected.value.isPrimary) {
    const others = (project.value.timelines ?? []).filter((item) => item.id !== selected.value?.id);
    for (const timeline of others) {
      if (timeline.isPrimary) {
        await store.saveTimeline({ ...timeline, isPrimary: false });
      }
    }
  }

  const normalizedEvents: TimelineEvent[] = selected.value.events.map((event) => ({
    ...event,
    title: event.title.trim() || '未命名事件',
    at: event.at.trim(),
    endAt: event.endAt?.trim() || undefined,
    description: event.description.trim(),
    tags: event.tags.filter(Boolean)
  }));

  await store.saveTimeline({ ...selected.value, events: normalizedEvents });
}

async function newTimeline() {
  const id = randomUUID();
  await store.createTimeline({
    id,
    name: '未命名时间线',
    color: '#7c8cff',
    description: '',
    isPrimary: false,
    events: []
  });

  if (store.currentProject?.timelines.length) {
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
.field.compact {
  margin-bottom: 0;
}
.events {
  display: grid;
  gap: 12px;
}
.axis-view {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 8px 0 8px 0;
}
.axis-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
}
.axis-item {
  position: relative;
  width: calc(50% - 18px);
  margin-right: auto;
}
.axis-item.right {
  margin-left: auto;
  margin-right: 0;
}
.axis-card {
  min-height: 110px;
}
.event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  right: -23px;
  top: 16px;
  border: 2px solid rgba(255,255,255,0.65);
}
.axis-item.right .event-dot {
  left: -23px;
}
.one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
  .axis-line { left: 12px; }
  .axis-item,
  .axis-item.right {
    width: calc(100% - 26px);
    margin-left: 26px;
    margin-right: 0;
  }
  .event-dot,
  .axis-item.right .event-dot {
    left: -20px;
    right: auto;
  }
}
</style>
