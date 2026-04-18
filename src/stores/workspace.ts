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

export const useWorkspaceStore = defineStore('workspace', () => {
  const projects = ref<ProjectSummary[]>([]);
  const currentProject = ref<ProjectData | null>(null);
  const currentModule = ref<WorkspaceModule>('dashboard');
  const selectedChapterId = ref<string | null>(null);
  const commandPaletteOpen = ref(false);
  const aiOutput = ref('');
  const loading = ref(false);
  const saving = ref(false);

  const currentChapter = computed(() =>
    currentProject.value?.chapters.find((chapter) => chapter.id === selectedChapterId.value) ?? null
  );

  const currentChapterWords = computed(() => {
    const plain = (currentChapter.value?.markdown ?? '').replace(/\s/g, '');
    return Array.from(plain).length;
  });

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
      selectedChapterId.value = project.chapters[0]?.id ?? null;
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

  async function saveChapter(chapter: ChapterDocument) {
    if (!currentProject.value) return;
    saving.value = true;
    try {
      await api.saveChapter(currentProject.value.id, chapter);
      await openProject(currentProject.value.id);
    } finally {
      saving.value = false;
    }
  }

  async function createChapter(partial: Partial<ChapterDocument>) {
    if (!currentProject.value) return;
    const chapter = await api.createChapter(currentProject.value.id, partial);
    await openProject(currentProject.value.id);
    selectedChapterId.value = chapter.id;
    return chapter;
  }

  async function saveCharacter(character: CharacterProfile) {
    if (!currentProject.value) return;
    await api.saveCharacter(currentProject.value.id, character);
    await openProject(currentProject.value.id);
  }

  async function createCharacter(payload: Partial<CharacterProfile>) {
    if (!currentProject.value) return;
    await api.createCharacter(currentProject.value.id, payload);
    await openProject(currentProject.value.id);
  }

  async function saveWorld(entry: WorldEntry) {
    if (!currentProject.value) return;
    await api.saveWorldEntry(currentProject.value.id, entry);
    await openProject(currentProject.value.id);
  }

  async function createWorld(payload: Partial<WorldEntry>) {
    if (!currentProject.value) return;
    await api.createWorldEntry(currentProject.value.id, payload);
    await openProject(currentProject.value.id);
  }

  async function saveTimeline(timeline: TimelineData) {
    if (!currentProject.value) return;
    await api.saveTimeline(currentProject.value.id, timeline);
    await openProject(currentProject.value.id);
  }

  async function createTimeline(payload: Partial<TimelineData>) {
    if (!currentProject.value) return;
    await api.createTimeline(currentProject.value.id, payload);
    await openProject(currentProject.value.id);
  }

  async function saveForeshadowing(item: ForeshadowingItem) {
    if (!currentProject.value) return;
    await api.saveForeshadowing(currentProject.value.id, item);
    await openProject(currentProject.value.id);
  }

  async function createForeshadowing(payload: Partial<ForeshadowingItem>) {
    if (!currentProject.value) return;
    await api.createForeshadowing(currentProject.value.id, payload);
    await openProject(currentProject.value.id);
  }

  async function saveNote(note: NoteCard) {
    if (!currentProject.value) return;
    await api.saveNote(currentProject.value.id, note);
    await openProject(currentProject.value.id);
  }

  async function createNote(payload: Partial<NoteCard>) {
    if (!currentProject.value) return;
    await api.createNote(currentProject.value.id, payload);
    await openProject(currentProject.value.id);
  }

  async function saveSettings(settings: AppSettings) {
    if (!currentProject.value) return;
    await api.saveSettings(currentProject.value.id, settings);
    await openProject(currentProject.value.id);
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
