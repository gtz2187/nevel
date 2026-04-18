<template>
  <div class="page-shell">
    <WindowChrome />

    <div class="hero glass">
      <div>
        <div class="title-lg">墨者</div>
        <div class="muted">从零重做版 · Electron + Vue 3 + NestJS · 本地优先的小说创作工作台</div>
      </div>

      <div class="row gap-12">
        <button class="ghost" @click="pickRoot">
          {{ selectedRoot ? '已选择存储目录' : '选择存储目录' }}
        </button>
        <button class="primary" @click="openCreateDialog">+ 新建项目</button>
      </div>
    </div>

    <div v-if="selectedRoot" class="path-tip glass">
      当前存储目录：{{ selectedRoot }}
    </div>

    <div v-if="errorMessage" class="error-tip glass">
      {{ errorMessage }}
    </div>

    <div class="projects-grid">
      <section
        v-for="project in store.projects"
        :key="project.id"
        class="project-card glass"
      >
        <div class="cover" :style="{ background: coverGradient(project.coverStyle) }"></div>
        <div class="content">
          <div class="title-md">{{ project.title }}</div>
          <div class="muted">{{ project.description || '本地小说项目' }}</div>
          <div class="muted">{{ formatDate(project.updatedAt) }}</div>

          <div class="progress" style="margin-top: 12px">
            <span
              :style="{
                width: `${Math.min(
                  100,
                  (project.completedChapters / Math.max(1, project.plannedChapters)) * 100
                )}%`
              }"
            ></span>
          </div>

          <div class="meta-row">
            <span>{{ project.totalWords }} 字</span>
            <span>{{ project.completedChapters }}/{{ project.plannedChapters }} 章</span>
          </div>

          <div class="row gap-12" style="margin-top: 16px">
            <button class="primary" @click="open(project.id)">打开</button>
            <button @click="duplicate(project.id)">复制</button>
            <button class="danger" @click="remove(project.id)">删除</button>
          </div>
        </div>
      </section>

      <section v-if="!store.projects.length" class="empty-state glass">
        当前还没有项目，先创建一个。
      </section>
    </div>

    <div v-if="showCreateDialog" class="dialog-mask" @click.self="closeCreateDialog">
      <div class="dialog-card glass">
        <div class="dialog-header">
          <div class="title-md">新建项目</div>
          <button class="ghost small-btn" @click="closeCreateDialog">关闭</button>
        </div>

        <div class="dialog-body">
          <label class="field-label">项目名称</label>
          <input
            ref="titleInputRef"
            v-model.trim="draftTitle"
            class="dialog-input"
            type="text"
            maxlength="60"
            placeholder="请输入项目名称"
            @keydown.enter.prevent="submitCreate"
          />

          <div class="muted" style="margin-top: 10px">
            未选择存储目录时，将使用默认目录。
          </div>

          <div v-if="dialogError" class="dialog-error">
            {{ dialogError }}
          </div>
        </div>

        <div class="dialog-footer">
          <button class="ghost" @click="closeCreateDialog">取消</button>
          <button class="primary" :disabled="creating" @click="submitCreate">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import { coverGradient, formatDate } from '@/lib/format';
import WindowChrome from '@/components/WindowChrome.vue';

const store = useWorkspaceStore();
const router = useRouter();

const selectedRoot = ref<string | undefined>(undefined);
const showCreateDialog = ref(false);
const draftTitle = ref('未命名小说');
const creating = ref(false);
const errorMessage = ref('');
const dialogError = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  void store.loadProjects();
});

async function pickRoot() {
  try {
    const dir = await window.mozheDesktop?.selectDirectory();
    if (dir) selectedRoot.value = dir;
  } catch (error) {
    errorMessage.value = toErrorMessage(error, '选择目录失败');
  }
}

function openCreateDialog() {
  draftTitle.value = '未命名小说';
  dialogError.value = '';
  showCreateDialog.value = true;

  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
}

function closeCreateDialog() {
  if (creating.value) return;
  showCreateDialog.value = false;
  dialogError.value = '';
}

async function submitCreate() {
  const title = draftTitle.value.trim();

  if (!title) {
    dialogError.value = '项目名称不能为空';
    return;
  }

  creating.value = true;
  dialogError.value = '';
  errorMessage.value = '';

  try {
    const project = await store.createProject(title, selectedRoot.value);
    showCreateDialog.value = false;
    await router.push(`/workspace/${project.id}/dashboard`);
  } catch (error) {
    dialogError.value = toErrorMessage(error, '创建失败');
  } finally {
    creating.value = false;
  }
}

async function open(projectId: string) {
  await store.openProject(projectId);
  await router.push(`/workspace/${projectId}/dashboard`);
}

async function remove(projectId: string) {
  if (!confirm('确认删除该项目吗？')) return;
  await store.removeProject(projectId);
}

async function duplicate(projectId: string) {
  await store.duplicateProject(projectId);
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return `${fallback}：${error.message}`;
  }
  return fallback;
}
</script>

<style scoped>
.hero {
  min-height: 112px;
  border-radius: 28px;
  padding: 22px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(54, 132, 85, 0.2);
}

.path-tip,
.error-tip {
  border-radius: 18px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.error-tip {
  color: #8c3131;
  background: rgba(255, 227, 227, 0.7);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 18px;
}

.project-card {
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(56, 130, 85, 0.16);
}

.cover {
  height: 140px;
}

.content {
  padding: 18px;
}

.meta-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  color: var(--muted);
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(14, 67, 40, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 24px;
}

.dialog-card {
  width: min(480px, 100%);
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(56, 130, 85, 0.28);
}

.dialog-header,
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-body {
  margin-top: 18px;
  margin-bottom: 18px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 14px;
}

.dialog-input {
  width: 100%;
  border: 1px solid rgba(50, 128, 81, 0.28);
  background: rgba(255, 255, 255, 0.74);
  color: #193d2a;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
}

.dialog-input:focus {
  border-color: rgba(56, 154, 97, 0.72);
}

.dialog-error {
  margin-top: 14px;
  border-radius: 14px;
  padding: 12px 14px;
  color: #8c3131;
  background: rgba(255, 226, 226, 0.84);
}

.small-btn {
  padding: 8px 12px;
}
</style>
