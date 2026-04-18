<template>
  <div class="page-shell">
    <WindowChrome />
    <CommandPalette :open="store.commandPaletteOpen" @close="store.commandPaletteOpen = false" />
    <TopToolbar />
    <div class="workspace">
      <ProjectSidebar />
      <main class="main-view glass">
        <component :is="currentComponent" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import WindowChrome from '@/components/WindowChrome.vue';
import TopToolbar from '@/components/TopToolbar.vue';
import ProjectSidebar from '@/components/ProjectSidebar.vue';
import CommandPalette from '@/components/CommandPalette.vue';
import DashboardModule from '@/components/modules/DashboardModule.vue';
import OutlineModule from '@/components/modules/OutlineModule.vue';
import ChapterEditorModule from '@/components/modules/ChapterEditorModule.vue';
import CharactersModule from '@/components/modules/CharactersModule.vue';
import TimelineModule from '@/components/modules/TimelineModule.vue';
import WorldModule from '@/components/modules/WorldModule.vue';
import ForeshadowingModule from '@/components/modules/ForeshadowingModule.vue';
import NotesBoardModule from '@/components/modules/NotesBoardModule.vue';
import SettingsModule from '@/components/modules/SettingsModule.vue';

const route = useRoute();
const store = useWorkspaceStore();

const map = {
  dashboard: DashboardModule,
  outline: OutlineModule,
  chapter: ChapterEditorModule,
  characters: CharactersModule,
  timeline: TimelineModule,
  world: WorldModule,
  foreshadowing: ForeshadowingModule,
  notes: NotesBoardModule,
  settings: SettingsModule
} as const;

const currentComponent = computed(() => map[store.currentModule]);


function handleKeydown(event: KeyboardEvent) {
  const meta = event.metaKey || event.ctrlKey;
  if (meta && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    store.commandPaletteOpen = true;
    return;
  }
  if (meta && event.key.toLowerCase() === 'j') {
    event.preventDefault();
    store.aiAssistantOpen = true;
    return;
  }
  if (meta && event.shiftKey && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    store.focusMode = !store.focusMode;
    return;
  }
  if (event.key === 'Escape' && store.commandPaletteOpen) {
    store.commandPaletteOpen = false;
    return;
  }
  if (event.key === 'Escape' && store.aiAssistantOpen) {
    store.aiAssistantOpen = false;
    return;
  }
}

onMounted(async () => {
  const projectId = String(route.params.projectId);
  await store.openProject(projectId);
  const nextModule = (route.params.module as keyof typeof map) || 'dashboard';
  store.currentModule = nextModule;
});

watch(
  () => route.params.module,
  (value) => {
    if (!value) return;
    store.currentModule = value as any;
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.workspace {
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.main-view {
  flex: 1;
  min-width: 0;
  height: calc(100vh - 196px);
  padding: 18px;
  border-radius: 24px;
  overflow-y: auto;
}
</style>
