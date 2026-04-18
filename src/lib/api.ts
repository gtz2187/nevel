import type {
  AskAIInput,
  ChapterDocument,
  CharacterProfile,
  CreateProjectInput,
  ForeshadowingItem,
  NoteCard,
  OutlineNode,
  ProjectData,
  ProjectSummary,
  TimelineData,
  WorldEntry
} from '@shared/models';

const API = 'http://127.0.0.1:3777/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<ProjectSummary[]>('/projects'),
  createProject: (payload: CreateProjectInput) =>
    request<ProjectData>('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  getProject: (projectId: string) => request<ProjectData>(`/projects/${projectId}`),
  deleteProject: (projectId: string) => request<{ ok: boolean }>(`/projects/${projectId}`, { method: 'DELETE' }),
  duplicateProject: (projectId: string) => request<{ ok: boolean; destination: string }>(`/projects/${projectId}/duplicate`, { method: 'POST' }),
  createSnapshot: (projectId: string) => request<{ ok: boolean; outputPath: string }>(`/projects/${projectId}/snapshot`, { method: 'POST' }),
  updateOutline: (projectId: string, outline: OutlineNode[]) =>
    request<ProjectData>(`/projects/${projectId}/outline`, { method: 'PUT', body: JSON.stringify(outline) }),
  createChapter: (projectId: string, payload: Partial<ChapterDocument>) =>
    request<ChapterDocument>(`/projects/${projectId}/chapters`, { method: 'POST', body: JSON.stringify(payload) }),
  saveChapter: (projectId: string, chapter: ChapterDocument) =>
    request<ChapterDocument>(`/projects/${projectId}/chapters/${chapter.id}`, { method: 'PUT', body: JSON.stringify(chapter) }),
  createCharacter: (projectId: string, payload: Partial<CharacterProfile>) =>
    request<CharacterProfile>(`/projects/${projectId}/characters`, { method: 'POST', body: JSON.stringify(payload) }),
  saveCharacter: (projectId: string, payload: CharacterProfile) =>
    request<CharacterProfile>(`/projects/${projectId}/characters/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createWorldEntry: (projectId: string, payload: Partial<WorldEntry>) =>
    request<WorldEntry>(`/projects/${projectId}/world`, { method: 'POST', body: JSON.stringify(payload) }),
  saveWorldEntry: (projectId: string, payload: WorldEntry) =>
    request<WorldEntry>(`/projects/${projectId}/world/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createTimeline: (projectId: string, payload: Partial<TimelineData>) =>
    request<TimelineData>(`/projects/${projectId}/timelines`, { method: 'POST', body: JSON.stringify(payload) }),
  saveTimeline: (projectId: string, payload: TimelineData) =>
    request<TimelineData>(`/projects/${projectId}/timelines/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createForeshadowing: (projectId: string, payload: Partial<ForeshadowingItem>) =>
    request<ForeshadowingItem>(`/projects/${projectId}/foreshadowing`, { method: 'POST', body: JSON.stringify(payload) }),
  saveForeshadowing: (projectId: string, payload: ForeshadowingItem) =>
    request<ForeshadowingItem>(`/projects/${projectId}/foreshadowing/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createNote: (projectId: string, payload: Partial<NoteCard>) =>
    request<NoteCard>(`/projects/${projectId}/notes`, { method: 'POST', body: JSON.stringify(payload) }),
  saveNote: (projectId: string, payload: NoteCard) =>
    request<NoteCard>(`/projects/${projectId}/notes/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  saveSettings: (projectId: string, payload: ProjectData['settings']) =>
    request(`/projects/${projectId}/settings`, { method: 'PUT', body: JSON.stringify(payload) }),
  askAI: (payload: AskAIInput) => request<{ answer: string; sources: Array<{ type: string; id: string; title: string }> }>('/ai/ask', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  extractEntities: (payload: { projectId: string; chapterId: string; content: string }) =>
    request<{ items: Array<{ name: string; type: string; excerpt: string }> }>('/ai/extract', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
