<template>
  <aside class="sidebar glass">
    <div class="project-name">{{ store.currentProject?.title }}</div>
    <ul class="list-reset nav-list">
      <li v-for="item in items" :key="item.key">
        <button
          class="nav-btn"
          :class="{ active: store.currentModule === item.key }"
          @click="store.currentModule = item.key"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </li>
    </ul>

    <div class="section-title muted">正文章节</div>
    <ul class="list-reset chapter-list">
      <li v-for="chapter in store.currentProject?.chapters ?? []" :key="chapter.id">
        <button class="chapter-btn" :class="{ active: store.selectedChapterId === chapter.id }" @click="store.selectChapter(chapter.id)">
          <div>{{ chapter.title }}</div>
          <div class="muted meta">{{ chapter.status }} · {{ chapter.targetWords }}字</div>
        </button>
      </li>
    </ul>
    <button class="primary add-btn" @click="addChapter">+ 新建章节</button>
  </aside>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace';

const store = useWorkspaceStore();

const items = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'outline', label: '大纲', icon: '🧠' },
  { key: 'chapter', label: '正文', icon: '📝' },
  { key: 'characters', label: '人物', icon: '👥' },
  { key: 'timeline', label: '时间线', icon: '⏳' },
  { key: 'world', label: '世界观', icon: '🌍' },
  { key: 'foreshadowing', label: '伏笔', icon: '🧩' },
  { key: 'notes', label: '灵感便签板', icon: '💡' },
  { key: 'settings', label: '设置', icon: '⚙️' }
] as const;

async function addChapter() {
  const chapter = await store.createChapter({ title: `第${(store.currentProject?.chapters.length ?? 0) + 1}章：未命名`, status: '规划中' });
  if (chapter) {
    store.currentModule = 'chapter';
  }
}
</script>

<style scoped>
.sidebar {
  width: 290px;
  min-width: 290px;
  height: calc(100vh - 108px);
  padding: 18px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.project-name {
  font-size: 18px;
  font-weight: 700;
  padding: 4px 2px 10px;
  color: #245138;
}
.nav-list, .chapter-list {
  display: grid;
  gap: 8px;
}
.nav-btn, .chapter-btn {
  width: 100%;
  text-align: left;
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 4px;
  border: 1px solid rgba(52, 122, 81, 0.16);
  background: rgba(255, 255, 255, 0.46);
}
.nav-btn {
  grid-template-columns: 26px 1fr;
  align-items: center;
}
.nav-btn.active, .chapter-btn.active {
  background: linear-gradient(120deg, rgba(84, 182, 119, 0.27), rgba(191, 243, 212, 0.3));
  border-color: rgba(58, 151, 95, 0.42);
  box-shadow: 0 10px 18px rgba(73, 146, 98, 0.18);
}
.meta { font-size: 12px; }
.section-title {
  margin-top: 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #46715c;
}
.chapter-list {
  flex: 1;
  overflow-y: auto;
}
.add-btn {
  margin-top: auto;
}
</style>
