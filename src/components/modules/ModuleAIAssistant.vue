<template>
  <section class="card card-pad ai-panel">
    <div class="row" style="justify-content: space-between; margin-bottom: 10px; gap: 10px; flex-wrap: wrap;">
      <div>
        <div class="title-sm">{{ title }}</div>
        <div class="muted">{{ purpose }}</div>
      </div>
      <button class="ghost" :disabled="loading" @click="applySuggested">填入推荐问题</button>
    </div>

    <textarea
      v-model="question"
      rows="4"
      :placeholder="placeholder || '请输入你在当前模块需要 AI 帮忙的具体问题...'"
    ></textarea>

    <div class="row" style="justify-content:flex-end; margin-top: 10px;">
      <button class="primary" :disabled="loading || !question.trim()" @click="ask">
        {{ loading ? '思考中...' : '发送给本模块 AI' }}
      </button>
    </div>

    <div v-if="answer" class="answer card card-pad">
      <div class="title-sm">模块建议</div>
      <pre>{{ answer }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { api } from '@/lib/api';

const props = defineProps<{
  moduleName: string;
  purpose: string;
  placeholder?: string;
  suggestedQuestion?: string;
}>();

const store = useWorkspaceStore();
const loading = ref(false);
const answer = ref('');
const question = ref(props.suggestedQuestion ?? '');

const title = computed(() => `${props.moduleName} · AI 助手`);

function applySuggested() {
  question.value = props.suggestedQuestion ?? '';
}

async function ask() {
  if (!store.currentProject || !question.value.trim()) return;
  loading.value = true;
  try {
    const enrichedQuestion = [
      `你现在是“${props.moduleName}模块”的专属写作助理。`,
      `当前任务目标：${props.purpose}`,
      `用户问题：${question.value.trim()}`,
      '请直接给出可执行建议，优先输出清单和下一步动作。'
    ].join('\n');
    const result = await api.askAI({
      projectId: store.currentProject.id,
      question: enrichedQuestion
    });
    answer.value = result.answer;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ai-panel {
  margin-top: 14px;
}
.answer {
  margin-top: 12px;
}
.answer pre {
  margin: 8px 0 0;
  white-space: pre-wrap;
  line-height: 1.65;
}
</style>
