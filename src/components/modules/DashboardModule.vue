<template>
  <div v-if="project" class="grid-3">
    <section class="card card-pad">
      <div class="title-md">欢迎回来</div>
      <p class="muted">今天适合推进的是“稳住开篇气质”和“把角色真正写活”。</p>
      <div class="row gap-16">
        <div>
          <div class="title-lg">{{ project.dashboard.currentStreak }}</div>
          <div class="muted">连续写作天数</div>
        </div>
        <div style="flex:1">
          <div class="row" style="justify-content:space-between">
            <span class="muted">今日目标</span>
            <span>{{ project.dashboard.todayWords }}/{{ project.dashboard.dailyGoal }}</span>
          </div>
          <div class="progress"><span :style="{ width: `${progress}%` }"></span></div>
        </div>
      </div>
    </section>

    <section class="card card-pad">
      <div class="title-md">最近章节</div>
      <ul class="list-reset">
        <li v-for="chapter in recentChapters" :key="chapter.id" class="recent-item">
          <button class="ghost" style="width:100%;text-align:left" @click="store.selectChapter(chapter.id)">
            <div>{{ chapter.title }}</div>
            <div class="muted">{{ chapter.status }} · {{ chapter.targetWords }} 字目标</div>
          </button>
        </li>
      </ul>
    </section>

    <section class="card card-pad">
      <div class="title-md">进度概览</div>
      <div class="title-lg">{{ project.completedChapters }} / {{ project.plannedChapters }}</div>
      <div class="muted">已完成章节 / 规划章节</div>
      <div class="progress"><span :style="{ width: `${chapterProgress}%` }"></span></div>
      <div class="muted" style="margin-top: 12px">总字数 {{ project.totalWords }}</div>
    </section>

    <section class="card card-pad">
      <div class="title-md">待办事项</div>
      <ul class="list-reset todo-list">
        <li v-for="todo in project.dashboard.todos" :key="todo.id">
          <label class="row gap-12">
            <input type="checkbox" :checked="todo.done" />
            <span>{{ todo.title }}</span>
          </label>
        </li>
      </ul>
    </section>

    <section class="card card-pad">
      <div class="title-md">AI 灵感碎片</div>
      <div class="idea" v-for="idea in project.dashboard.ideas" :key="idea">
        {{ idea }}
      </div>
    </section>

    <section class="card card-pad">
      <div class="title-md">创作提醒</div>
      <div class="muted">这版工作台已经带上了项目快照、本地 AI 接口占位、章节自动保存、Markdown 预览和基础设定库联动入口。</div>
      <div class="row gap-12" style="margin-top:16px">
        <span class="badge">本地文件优先</span>
        <span class="badge">可继续扩 RAG</span>
        <span class="badge">Electron 桌面版</span>
      </div>
    </section>

    <ModuleAIAssistant
      class="full-row"
      module-name="仪表盘"
      purpose="总结当前项目进度风险，并给出今天最值得推进的三件事"
      placeholder="例如：帮我制定今天 90 分钟写作冲刺计划"
      suggested-question="请根据当前进度给出今天最优先的三项写作任务，并解释原因。"
    />
  </div>
  <div v-else class="empty-state">未加载项目</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import ModuleAIAssistant from './ModuleAIAssistant.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);

const progress = computed(() => {
  if (!project.value) return 0;
  return Math.min(100, (project.value.dashboard.todayWords / Math.max(1, project.value.dashboard.dailyGoal)) * 100);
});

const chapterProgress = computed(() => {
  if (!project.value) return 0;
  return Math.min(100, (project.value.completedChapters / Math.max(1, project.value.plannedChapters)) * 100);
});

const recentChapters = computed(() => {
  if (!project.value) return [];
  const ids = project.value.dashboard.recentChapterIds;
  return ids.map((id) => project.value!.chapters.find((chapter) => chapter.id === id)).filter(Boolean);
});
</script>

<style scoped>
.todo-list, .idea {
  margin-top: 10px;
}
.idea {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  line-height: 1.7;
}
.recent-item {
  margin-top: 10px;
}
.full-row {
  grid-column: 1 / -1;
}
</style>
