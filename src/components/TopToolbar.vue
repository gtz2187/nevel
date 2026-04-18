<template>
  <div class="toolbar glass">
    <div class="left">
      <div class="title-sm">{{ title }}</div>
      <div class="muted">{{ subtitle }}</div>
    </div>
    <div class="right">
      <button class="ghost" @click="store.commandPaletteOpen = true">⌘K 搜索</button>
      <button class="ghost" @click="store.createSnapshot()">创建快照</button>
      <button class="primary" @click="store.aiAssistantOpen = true">AI 助手</button>
    </div>
  </div>

  <div v-if="store.aiAssistantOpen" class="assistant-mask" @click.self="store.aiAssistantOpen = false">
    <section class="assistant-panel card card-pad">
      <div class="row" style="justify-content:space-between">
        <div>
          <div class="title-md">AI 写作助手</div>
          <div class="muted">支持剧情梳理、矛盾排查、创意发散（Cmd/Ctrl + J）</div>
        </div>
        <button class="ghost" @click="store.aiAssistantOpen = false">关闭</button>
      </div>
      <textarea class="assistant-input" v-model="question" rows="6" placeholder="例：请帮我检查第一卷中主角动机是否一致，并给出修改建议"></textarea>
      <div class="row" style="justify-content:flex-end">
        <button class="primary" :disabled="loading || !question.trim()" @click="askAi">{{ loading ? '请求中...' : '发送' }}</button>
      </div>
      <div v-if="store.aiOutput" class="answer card card-pad">
        <div class="title-sm">AI 回复</div>
        <pre class="assistant-output">{{ store.aiOutput }}</pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';

const store = useWorkspaceStore();
const loading = ref(false);
const question = ref('请概括当前第一卷的问题和机会');

const title = computed(() => {
  if (!store.currentProject) return '墨者';
  return `${store.currentProject.title} · 工作台`;
});

const subtitle = computed(() => {
  if (!store.currentProject) return '';
  return `总字数 ${store.currentProject.totalWords} · 已完成章节 ${store.currentProject.completedChapters}/${store.currentProject.plannedChapters}`;
});

async function askAi() {
  if (!question.value.trim()) return;
  loading.value = true;
  try {
    await store.askAI(question.value.trim());
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.toolbar {
  height: 72px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  margin-bottom: 16px;
}
.left {
  display: grid;
  gap: 4px;
}
.right {
  display: flex;
  gap: 10px;
}
.assistant-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
}
.assistant-panel {
  width: min(900px, calc(100vw - 48px));
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.assistant-panel {
  border-style: dashed;
}
.assistant-input {
  background: #f8fff8;
  color: #1e3426;
  font-size: 15px;
  line-height: 1.7;
}
.answer {
  background: #f4fbf4;
  border-color: rgba(80, 150, 102, 0.35);
}
.assistant-output {
  white-space: pre-wrap;
  line-height: 1.75;
  margin: 8px 0 0;
  color: #163124;
}
</style>
