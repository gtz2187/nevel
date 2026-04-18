<template>
  <div v-if="project && draft" class="grid-2">
    <section class="card card-pad">
      <div class="title-md">通用设置</div>
      <label class="field"><span class="muted">主题</span>
        <select v-model="draft.theme">
          <option value="dark">深色</option>
          <option value="light">浅色</option>
          <option value="system">跟随系统</option>
        </select>
      </label>
      <label class="field"><span class="muted">默认项目目录</span>
        <div class="row gap-12">
          <input v-model="draft.defaultProjectRoot" style="flex:1" />
          <button @click="pickDir">选择目录</button>
        </div>
      </label>
      <label class="field"><span class="muted">启动行为</span>
        <select v-model="draft.startBehavior">
          <option value="show-list">显示项目列表</option>
          <option value="open-last-project">打开上次项目</option>
          <option value="new-empty">新建空白项目</option>
        </select>
      </label>
    </section>

    <section class="card card-pad">
      <div class="title-md">编辑器设置</div>
      <label class="field"><span class="muted">字体</span><input v-model="draft.editor.fontFamily" /></label>
      <label class="field"><span class="muted">字号</span><input v-model.number="draft.editor.fontSize" type="number" /></label>
      <label class="field"><span class="muted">行高</span><input v-model.number="draft.editor.lineHeight" type="number" step="0.1" /></label>
      <label class="field"><span class="muted">自动保存间隔（秒）</span><input v-model.number="draft.editor.autoSaveSeconds" type="number" /></label>
    </section>

    <section class="card card-pad">
      <div class="title-md">AI 设置</div>
      <label class="field"><span class="muted">提供商</span><input v-model="draft.ai.provider" /></label>
      <label class="field"><span class="muted">API Base URL</span><input v-model="draft.ai.apiBaseUrl" placeholder="https://api.openai.com/v1" /></label>
      <label class="field"><span class="muted">API Key（本地保存）</span><input v-model="draft.ai.apiKey" type="password" placeholder="sk-..." /></label>
      <label class="field"><span class="muted">模型</span><input v-model="draft.ai.model" /></label>
      <label class="field"><span class="muted">温度</span><input v-model.number="draft.ai.temperature" type="number" step="0.1" /></label>
      <label class="field"><span class="muted">语气</span><input v-model="draft.ai.tone" /></label>
      <label class="row gap-8 muted"><input type="checkbox" v-model="draft.ai.allowWeb" />允许联网检索</label>
      <div class="muted">说明：当前版本 AI 服务仍是本地占位逻辑，以上 API 配置已完成保存与展示，后续可无缝接入真实在线模型。</div>
    </section>

    <section class="card card-pad">
      <div class="row" style="justify-content:space-between; margin-bottom: 12px">
        <div class="title-md">音频设置</div>
        <button @click="addTrack">+ 音乐项</button>
      </div>
      <div class="field" v-for="track in draft.music" :key="track.id">
        <input v-model="track.title" placeholder="标题" />
        <input v-model="track.filePath" placeholder="文件路径" />
      </div>
      <button class="primary" @click="save">保存全部设置</button>
    </section>

    <ModuleAIAssistant
      module-name="设置中心"
      purpose="根据创作习惯给出参数调优建议"
      placeholder="例如：我写作容易分心，帮我推荐一组设置参数"
      suggested-question="请基于长篇小说创作场景，给出一套提高专注度的编辑器与 AI 参数配置建议。"
    />
  </div>
  <div v-else class="empty-state">未加载项目</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import type { AppSettings } from '@shared/models';
import { randomUUID } from '@/utils/uuid';
import ModuleAIAssistant from './ModuleAIAssistant.vue';

const store = useWorkspaceStore();
const project = computed(() => store.currentProject);
const draft = ref<AppSettings | null>(null);

watch(
  () => project.value?.settings,
  (value) => {
    draft.value = value ? JSON.parse(JSON.stringify(value)) : null;
  },
  { immediate: true }
);

async function pickDir() {
  const result = await window.mozheDesktop?.selectDirectory();
  if (result && draft.value) {
    draft.value.defaultProjectRoot = result;
  }
}

function addTrack() {
  draft.value?.music.push({
    id: randomUUID(),
    title: '未命名音轨',
    filePath: ''
  });
}

async function save() {
  if (!draft.value) return;
  await store.saveSettings(draft.value);
  await window.mozheDesktop?.notify('设置已保存', '项目设置已经写入本地');
}
</script>

<style scoped>
.field {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
