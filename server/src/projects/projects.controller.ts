import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProjectsService } from './projects.service.js';
import type {
  ChapterDocument,
  CharacterProfile,
  CreateProjectInput,
  ForeshadowingItem,
  NoteCard,
  OutlineNode,
  TimelineData,
  WorldEntry
} from '../../../shared/models.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  listProjects() {
    return this.projectsService.listProjects();
  }

  @Get('root')
  getProjectRoot() {
    return this.projectsService.getRoot();
  }

  @Post()
  createProject(@Body() payload: CreateProjectInput) {
    return this.projectsService.createProject(payload);
  }

  @Get(':projectId')
  getProject(@Param('projectId') projectId: string) {
    return this.projectsService.getProject(projectId);
  }

  @Delete(':projectId')
  removeProject(@Param('projectId') projectId: string) {
    return this.projectsService.removeProject(projectId);
  }

  @Post(':projectId/duplicate')
  duplicateProject(@Param('projectId') projectId: string) {
    return this.projectsService.duplicateProject(projectId);
  }

  @Post(':projectId/snapshot')
  createSnapshot(@Param('projectId') projectId: string) {
    return this.projectsService.createSnapshot(projectId);
  }

  @Put(':projectId/outline')
  updateOutline(@Param('projectId') projectId: string, @Body() outline: OutlineNode[]) {
    return this.projectsService.updateOutline(projectId, outline);
  }

  @Post(':projectId/chapters')
  createChapter(@Param('projectId') projectId: string, @Body() payload: Partial<ChapterDocument>) {
    const now = new Date().toISOString();
    const chapter: ChapterDocument = {
      id: payload.id ?? randomUUID(),
      title: payload.title ?? '未命名章节',
      outlineNodeId: payload.outlineNodeId,
      status: payload.status ?? '规划中',
      targetWords: payload.targetWords ?? 3000,
      markdown: payload.markdown ?? '',
      tags: payload.tags ?? [],
      characterIds: payload.characterIds ?? [],
      locationIds: payload.locationIds ?? [],
      timelineEventIds: payload.timelineEventIds ?? [],
      foreshadowingIds: payload.foreshadowingIds ?? [],
      notes: payload.notes ?? '',
      createdAt: payload.createdAt ?? now,
      updatedAt: now,
      versions: payload.versions ?? []
    };
    return this.projectsService.upsertChapter(projectId, chapter);
  }

  @Put(':projectId/chapters/:chapterId')
  updateChapter(
    @Param('projectId') projectId: string,
    @Body() payload: ChapterDocument
  ) {
    return this.projectsService.upsertChapter(projectId, payload);
  }

  @Post(':projectId/characters')
  createCharacter(@Param('projectId') projectId: string, @Body() payload: Partial<CharacterProfile>) {
    const now = new Date().toISOString();
    const character: CharacterProfile = {
      id: payload.id ?? randomUUID(),
      name: payload.name ?? '未命名人物',
      aliases: payload.aliases ?? [],
      gender: payload.gender ?? '未知',
      age: payload.age ?? '',
      race: payload.race ?? '',
      occupation: payload.occupation ?? '',
      faction: payload.faction ?? '',
      importance: payload.importance ?? '次要配角',
      appearance: payload.appearance ?? '',
      personalityTags: payload.personalityTags ?? [],
      background: payload.background ?? '',
      skills: payload.skills ?? [],
      relationships: payload.relationships ?? [],
      notes: payload.notes ?? '',
      appearanceCount: payload.appearanceCount ?? 0,
      firstAppearanceChapterId: payload.firstAppearanceChapterId,
      latestAppearanceChapterId: payload.latestAppearanceChapterId,
      createdAt: payload.createdAt ?? now,
      updatedAt: now
    };
    return this.projectsService.upsertCharacter(projectId, character);
  }

  @Put(':projectId/characters/:characterId')
  updateCharacter(@Param('projectId') projectId: string, @Body() payload: CharacterProfile) {
    return this.projectsService.upsertCharacter(projectId, payload);
  }

  @Post(':projectId/world')
  createWorld(@Param('projectId') projectId: string, @Body() payload: Partial<WorldEntry>) {
    const now = new Date().toISOString();
    const entry: WorldEntry = {
      id: payload.id ?? randomUUID(),
      name: payload.name ?? '未命名词条',
      aliases: payload.aliases ?? [],
      categories: payload.categories ?? ['未分类'],
      summary: payload.summary ?? '',
      content: payload.content ?? '',
      linkedEntryIds: payload.linkedEntryIds ?? [],
      tags: payload.tags ?? [],
      createdAt: payload.createdAt ?? now,
      updatedAt: now
    };
    return this.projectsService.upsertWorldEntry(projectId, entry);
  }

  @Put(':projectId/world/:entryId')
  updateWorld(@Param('projectId') projectId: string, @Body() payload: WorldEntry) {
    return this.projectsService.upsertWorldEntry(projectId, payload);
  }

  @Post(':projectId/timelines')
  createTimeline(@Param('projectId') projectId: string, @Body() payload: Partial<TimelineData>) {
    const timeline: TimelineData = {
      id: payload.id ?? randomUUID(),
      name: payload.name ?? '未命名时间线',
      color: payload.color ?? '#7c8cff',
      description: payload.description ?? '',
      isPrimary: payload.isPrimary ?? false,
      events: payload.events ?? []
    };
    return this.projectsService.upsertTimeline(projectId, timeline);
  }

  @Put(':projectId/timelines/:timelineId')
  updateTimeline(@Param('projectId') projectId: string, @Body() payload: TimelineData) {
    return this.projectsService.upsertTimeline(projectId, payload);
  }

  @Post(':projectId/foreshadowing')
  createForeshadowing(@Param('projectId') projectId: string, @Body() payload: Partial<ForeshadowingItem>) {
    const item: ForeshadowingItem = {
      id: payload.id ?? randomUUID(),
      title: payload.title ?? '未命名伏笔',
      description: payload.description ?? '',
      plantedChapterId: payload.plantedChapterId,
      plannedRevealChapterId: payload.plannedRevealChapterId,
      actualRevealChapterId: payload.actualRevealChapterId,
      status: payload.status ?? '未揭示',
      tags: payload.tags ?? []
    };
    return this.projectsService.upsertForeshadowing(projectId, item);
  }

  @Put(':projectId/foreshadowing/:itemId')
  updateForeshadowing(@Param('projectId') projectId: string, @Body() payload: ForeshadowingItem) {
    return this.projectsService.upsertForeshadowing(projectId, payload);
  }

  @Post(':projectId/notes')
  createNote(@Param('projectId') projectId: string, @Body() payload: Partial<NoteCard>) {
    const now = new Date().toISOString();
    const item: NoteCard = {
      id: payload.id ?? randomUUID(),
      title: payload.title ?? '未命名便签',
      content: payload.content ?? '',
      color: payload.color ?? '#f5b8ff',
      x: payload.x ?? 0,
      y: payload.y ?? 0,
      width: payload.width ?? 280,
      height: payload.height ?? 180,
      createdAt: payload.createdAt ?? now,
      updatedAt: now
    };
    return this.projectsService.upsertNote(projectId, item);
  }

  @Put(':projectId/notes/:itemId')
  updateNote(@Param('projectId') projectId: string, @Body() payload: NoteCard) {
    return this.projectsService.upsertNote(projectId, payload);
  }

  @Put(':projectId/settings')
  updateSettings(@Param('projectId') projectId: string, @Body() payload: any) {
    return this.projectsService.updateSettings(projectId, payload);
  }
}
