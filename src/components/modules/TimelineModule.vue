<template>
  <div v-if="project" class="entity-layout">
    <section class="card card-pad list-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">时间线</div>
        <button class="primary" @click="newTimeline">+ 新建时间线</button>
      </div>
      <button
        v-for="timeline in project.timelines"
        :key="timeline.id"
        class="entity-item"
        :class="{ active: selected?.id === timeline.id }"
        @click="select(timeline.id)"
      >
        <div class="title-sm">{{ timeline.name }}</div>
        <div class="muted">{{ timeline.events.length }} 个事件</div>
      </button>
    </section>

    <section v-if="selected" class="card card-pad detail-pane">
      <div class="row" style="justify-content:space-between; margin-bottom:14px">
        <div class="title-md">时间线编辑</div>
        <div class="row gap-12">
          <button @click="addEvent">+ 事件</button>
          <button class="primary" @click="save">保存时间线</button>
        </div>
      </div>
      <label class="field"><span class="muted">名称</span><input v-model="selected.name" /></label>
      <label class="field"><span class="muted">说明</span><textarea v-model="selected.description" rows="4"></textarea></label>

      <div class="events">
        <div class="event card card-pad" v-for="event in selected.events" :key="event.id">
          <input v-model="event.title" placeholder="事件名" />
          <div class="grid-2" style="margin-top:10px">
            <input v-model="event.at" placeholder="发生时间" />
            <select v-model="event.type">
              <option>剧情事件</option>
              <option>背景大事件</option>
              <option>人物个人事件</option>
            </select>
          </div>
          <textarea v-model="event.description" rows="4" style="margin-top:10px"></textarea>
        </div>
      </div>
    </section>

    <div v-else class="empty-state">请选择或创建一条时间线</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';
import type { TimelineData } from '@shared/models';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const selected = ref<TimelineData | null>(null);

function select(id: string) {
  const item = project.value?.timelines.find((timeline) => timeline.id === id);
  selected.value = item ? JSON.parse(JSON.stringify(item)) : null;
}

function addEvent() {
  if (!selected.value) return;
  selected.value.events.push({
    id: randomUUID(),
    title: '未命名事件',
    at: '',
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

async function save() {
  if (!selected.value) return;
  await store.saveTimeline(selected.value);
}

async function newTimeline() {
  await store.createTimeline({
    id: randomUUID(),
    name: '未命名时间线',
    color: '#7c8cff',
    description: '',
    isPrimary: false,
    events: []
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
.events {
  display: grid;
  gap: 12px;
}
@media (max-width: 1200px) {
  .entity-layout { grid-template-columns: 1fr; }
}
</style>
