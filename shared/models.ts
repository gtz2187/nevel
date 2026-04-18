export type NodeType = 'volume' | 'chapter' | 'section';
export type NodeStatus = '规划中' | '写作中' | '待修改' | '已完成' | '已废弃';
export type Importance = '主角' | '重要配角' | '次要配角' | '龙套';
export type TimelineEventType = '剧情事件' | '背景大事件' | '人物个人事件';
export type ForeshadowingStatus = '未揭示' | '已揭示' | '已废弃';
export type ThemeMode = 'light' | 'dark' | 'system';
export type WorkspaceModule =
  | 'dashboard'
  | 'outline'
  | 'chapter'
  | 'characters'
  | 'timeline'
  | 'world'
  | 'foreshadowing'
  | 'notes'
  | 'settings';

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  dueAt?: string;
  children: TodoItem[];
}

export interface DashboardStats {
  currentStreak: number;
  todayWords: number;
  dailyGoal: number;
  recentChapterIds: string[];
  todos: TodoItem[];
  ideas: string[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  coverStyle: string;
  createdAt: string;
  updatedAt: string;
  totalWords: number;
  completedChapters: number;
  plannedChapters: number;
  rootPath: string;
}

export interface OutlineNode {
  id: string;
  type: NodeType;
  title: string;
  status: NodeStatus;
  targetWords: number;
  summary: string;
  colorTag?: string;
  chapterId?: string;
  children: OutlineNode[];
}

export interface VersionRecord {
  id: string;
  savedAt: string;
  mode: 'manual' | 'autosave';
  words: number;
}

export interface ChapterLink {
  chapterId: string;
  chapterTitle: string;
  note?: string;
}

export interface ChapterDocument {
  id: string;
  title: string;
  outlineNodeId?: string;
  status: NodeStatus;
  targetWords: number;
  markdown: string;
  tags: string[];
  characterIds: string[];
  locationIds: string[];
  timelineEventIds: string[];
  foreshadowingIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  versions: VersionRecord[];
}

export interface CharacterRelationship {
  id: string;
  targetCharacterId: string;
  types: string[];
  description: string;
  directional: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  aliases: string[];
  gender: string;
  age: string;
  race: string;
  occupation: string;
  faction: string;
  importance: Importance;
  appearance: string;
  personalityTags: string[];
  background: string;
  skills: { id: string; name: string; level: string; description: string }[];
  relationships: CharacterRelationship[];
  notes: string;
  appearanceCount: number;
  firstAppearanceChapterId?: string;
  latestAppearanceChapterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorldEntry {
  id: string;
  name: string;
  aliases: string[];
  categories: string[];
  summary: string;
  content: string;
  linkedEntryIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  at: string;
  endAt?: string;
  type: TimelineEventType;
  description: string;
  characterIds: string[];
  placeIds: string[];
  chapterIds: string[];
  previousEventIds: string[];
  nextEventIds: string[];
  tags: string[];
}

export interface TimelineData {
  id: string;
  name: string;
  color: string;
  description: string;
  isPrimary: boolean;
  events: TimelineEvent[];
}

export interface ForeshadowingItem {
  id: string;
  title: string;
  description: string;
  plantedChapterId?: string;
  plannedRevealChapterId?: string;
  actualRevealChapterId?: string;
  status: ForeshadowingStatus;
  tags: string[];
}

export interface NoteCard {
  id: string;
  title: string;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  filePath: string;
}

export interface AISettings {
  provider: string;
  apiBaseUrl: string;
  apiKeyHint: string;
  apiKey: string;
  model: string;
  temperature: number;
  tone: string;
  allowWeb: boolean;
}

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  autoSaveSeconds: number;
  focusModeBackground: string;
}

export interface AppSettings {
  theme: ThemeMode;
  language: 'zh-CN' | 'en-US';
  defaultProjectRoot: string;
  startBehavior: 'show-list' | 'open-last-project' | 'new-empty';
  editor: EditorSettings;
  ai: AISettings;
  music: AudioTrack[];
}

export interface ProjectData extends ProjectSummary {
  dashboard: DashboardStats;
  settings: AppSettings;
  outline: OutlineNode[];
  chapters: ChapterDocument[];
  characters: CharacterProfile[];
  worldEntries: WorldEntry[];
  timelines: TimelineData[];
  foreshadowing: ForeshadowingItem[];
  notes: NoteCard[];
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  location?: string;
}

export interface AskAIInput {
  projectId: string;
  question: string;
}

export interface ExtractEntitiesInput {
  projectId: string;
  chapterId: string;
  content: string;
}
