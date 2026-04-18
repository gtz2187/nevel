import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type {
  AppSettings,
  ChapterDocument,
  CharacterProfile,
  ForeshadowingItem,
  NoteCard,
  ProjectData,
  ProjectSummary,
  TimelineData,
  WorldEntry,
  WorkspaceModule
} from '@shared/models';

function countWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-!\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return Array.from(plain.replace(/\s/g, '')).length;
}

function upsertById<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index >= 0) list[index] = item;
  else list.push(item);
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const projects = ref<ProjectSummary[]>([]);
  const currentProject = ref<ProjectData | null>(null);
  const currentModule = ref<WorkspaceModule>('dashboard');
  const selectedChapterId = ref<string | null>(null);
  const commandPaletteOpen = ref(false);
  const aiAssistantOpen = ref(false);
  const focusMode = ref(false);
  const aiOutput = ref('');
  const loading = ref(false);
  const saving = ref(false);

  const currentChapter = computed(() =>
    currentProject.value?.chapters.find((chapter) => chapter.id === selectedChapterId.value) ?? null
  );

  const currentChapterWords = computed(() => countWords(currentChapter.value?.markdown ?? ''));

  function countOutlineChapterNodes(nodes: ProjectData['outline']): number {
    let total = 0;
    for (const node of nodes) {
      if (node.type === 'chapter') total += 1;
      total += countOutlineChapterNodes(node.children);
    }
    return total;
  }

  function refreshProjectStats(project: ProjectData) {
    project.totalWords = project.chapters.reduce((sum, chapter) => sum + countWords(chapter.markdown), 0);
    project.completedChapters = project.chapters.filter((chapter) => chapter.status === '已完成').length;
    project.plannedChapters = Math.max(project.chapters.length, countOutlineChapterNodes(project.outline));
    project.updatedAt = new Date().toISOString();
  }

  function syncProjectSummary(projectId: string) {
    const active = currentProject.value;
    if (!active || active.id !== projectId) return;
    const summary = projects.value.find((item) => item.id === projectId);
    if (!summary) return;
    summary.updatedAt = active.updatedAt;
    summary.totalWords = active.totalWords;
    summary.completedChapters = active.completedChapters;
    summary.plannedChapters = active.plannedChapters;
  }

  async function loadProjects() {
    projects.value = await api.listProjects();
  }

  async function createProject(title: string, location?: string) {
    loading.value = true;
    try {
      const project = await api.createProject({ title, location });
      currentProject.value = project;
      selectedChapterId.value = project.chapters[0]?.id ?? null;
      await loadProjects();
      return project;
    } finally {
      loading.value = false;
    }
  }

  async function openProject(projectId: string) {
    loading.value = true;
    try {
      const project = await api.getProject(projectId);
      currentProject.value = project;
      selectedChapterId.value = selectedChapterId.value && project.chapters.some((chapter) => chapter.id === selectedChapterId.value)
        ? selectedChapterId.value
        : project.chapters[0]?.id ?? null;
      return project;
    } finally {
      loading.value = false;
    }
  }

  async function removeProject(projectId: string) {
    await api.deleteProject(projectId);
    if (currentProject.value?.id === projectId) {
      currentProject.value = null;
      selectedChapterId.value = null;
    }
    await loadProjects();
  }

  async function duplicateProject(projectId: string) {
    await api.duplicateProject(projectId);
    await loadProjects();
  }

  async function createSnapshot() {
    if (!currentProject.value) return;
    const result = await api.createSnapshot(currentProject.value.id);
    await window.mozheDesktop?.notify('快照已创建', result.outputPath);
  }

  async function selectChapter(chapterId: string) {
    selectedChapterId.value = chapterId;
    currentModule.value = 'chapter';
  }

  async function updateOutline(outline: ProjectData['outline']) {
    if (!currentProject.value) return;
    await api.updateOutline(currentProject.value.id, outline);
    currentProject.value.outline = outline;
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function saveChapter(chapter: ChapterDocument) {
    if (!currentProject.value) return;
    saving.value = true;
    try {
      const saved = await api.saveChapter(currentProject.value.id, chapter);
      upsertById(currentProject.value.chapters, saved);
      refreshProjectStats(currentProject.value);
      syncProjectSummary(currentProject.value.id);
    } finally {
      saving.value = false;
    }
  }

  async function createChapter(partial: Partial<ChapterDocument>) {
    if (!currentProject.value) return;
    const chapter = await api.createChapter(currentProject.value.id, partial);
    upsertById(currentProject.value.chapters, chapter);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
    selectedChapterId.value = chapter.id;
    return chapter;
  }

  async function saveCharacter(character: CharacterProfile) {
    if (!currentProject.value) return;
    const saved = await api.saveCharacter(currentProject.value.id, character);
    upsertById(currentProject.value.characters, saved);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function createCharacter(payload: Partial<CharacterProfile>) {
    if (!currentProject.value) return;
    const created = await api.createCharacter(currentProject.value.id, payload);
    upsertById(currentProject.value.characters, created);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function saveWorld(entry: WorldEntry) {
    if (!currentProject.value) return;
    const saved = await api.saveWorldEntry(currentProject.value.id, entry);
    upsertById(currentProject.value.worldEntries, saved);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function createWorld(payload: Partial<WorldEntry>) {
    if (!currentProject.value) return;
    const created = await api.createWorldEntry(currentProject.value.id, payload);
    upsertById(currentProject.value.worldEntries, created);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function saveTimeline(timeline: TimelineData) {
    if (!currentProject.value) return;
    const saved = await api.saveTimeline(currentProject.value.id, timeline);
    upsertById(currentProject.value.timelines, saved);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function createTimeline(payload: Partial<TimelineData>) {
    if (!currentProject.value) return;
    const created = await api.createTimeline(currentProject.value.id, payload);
    upsertById(currentProject.value.timelines, created);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function saveForeshadowing(item: ForeshadowingItem) {
    if (!currentProject.value) return;
    const saved = await api.saveForeshadowing(currentProject.value.id, item);
    upsertById(currentProject.value.foreshadowing, saved);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function createForeshadowing(payload: Partial<ForeshadowingItem>) {
    if (!currentProject.value) return;
    const created = await api.createForeshadowing(currentProject.value.id, payload);
    upsertById(currentProject.value.foreshadowing, created);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function saveNote(note: NoteCard) {
    if (!currentProject.value) return;
    const saved = await api.saveNote(currentProject.value.id, note);
    upsertById(currentProject.value.notes, saved);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function createNote(payload: Partial<NoteCard>) {
    if (!currentProject.value) return;
    const created = await api.createNote(currentProject.value.id, payload);
    upsertById(currentProject.value.notes, created);
    refreshProjectStats(currentProject.value);
    syncProjectSummary(currentProject.value.id);
  }

  async function saveSettings(settings: AppSettings) {
    if (!currentProject.value) return;
    await api.saveSettings(currentProject.value.id, settings);
    currentProject.value.settings = settings;
    currentProject.value.updatedAt = new Date().toISOString();
    syncProjectSummary(currentProject.value.id);
  }

  async function askAI(question: string) {
    if (!currentProject.value) return;
    const result = await api.askAI({ projectId: currentProject.value.id, question });
    aiOutput.value = result.answer;
  }

  return {
    projects,
    currentProject,
    currentModule,
    selectedChapterId,
    currentChapter,
    currentChapterWords,
    commandPaletteOpen,
    aiAssistantOpen,
    focusMode,
    aiOutput,
    loading,
    saving,
    loadProjects,
    createProject,
    openProject,
    removeProject,
    duplicateProject,
    createSnapshot,
    selectChapter,
    updateOutline,
    saveChapter,
    createChapter,
    saveCharacter,
    createCharacter,
    saveWorld,
    createWorld,
    saveTimeline,
    createTimeline,
    saveForeshadowing,
    createForeshadowing,
    saveNote,
    createNote,
    saveSettings,
    askAI
  };
});
