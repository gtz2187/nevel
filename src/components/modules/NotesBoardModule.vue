<template>
  <div v-if="project" class="notes-board">
    <div class="row" style="justify-content:space-between; margin-bottom: 16px">
      <div class="title-md">灵感便签板</div>
      <button class="primary" @click="newNote">+ 新建便签</button>
    </div>

    <div class="board">
      <div
        v-for="note in project.notes"
        :key="note.id"
        class="note-card"
        :style="{ background: note.color, width: `${note.width}px`, minHeight: `${note.height}px` }"
      >
        <div class="title-sm" style="color:#261b31">{{ note.title }}</div>
        <textarea
          :value="note.content"
          @change="updateContent(note.id, ($event.target as HTMLTextAreaElement).value)"
          rows="6"
        ></textarea>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">未加载项目</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { randomUUID } from '@/utils/uuid';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);

async function newNote() {
  await store.createNote({
    id: randomUUID(),
    title: '新便签',
    content: '',
    color: ['#f5b8ff', '#b9f0ff', '#ffd78e', '#c8ffbd'][Math.floor(Math.random() * 4)],
    x: 0,
    y: 0,
    width: 280,
    height: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

async function updateContent(noteId: string, content: string) {
  const note = project.value?.notes.find((item) => item.id === noteId);
  if (!note) return;
  await store.saveNote({ ...note, content });
}
</script>

<style scoped>
.notes-board {
  min-height: 70vh;
}
.board {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.note-card {
  padding: 14px;
  border-radius: 18px;
  color: #261b31;
  box-shadow: 0 18px 32px rgba(0,0,0,0.18);
}
.note-card textarea {
  width: 100%;
  margin-top: 10px;
  border: 0;
  background: rgba(255,255,255,0.55);
  color: #261b31;
}
</style>
