import { Injectable } from '@nestjs/common';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import fs from 'fs-extra';
import archiver from 'archiver';

import {
  countWords,
  defaultSettings,
  makeSampleProject
} from '../../../shared/defaults.js';
import type {
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
} from '../../../shared/models.js';

const META_FILE = 'project.moz.json';
const REGISTRY_FILE = '.mozhe-projects.json';

@Injectable()
export class ProjectsService {
  private readonly root = path.join(os.homedir(), 'Documents', 'MoZheProjects');
  private readonly registryFile = path.join(this.root, REGISTRY_FILE);

  async ensureRoot() {
    await fs.ensureDir(this.root);
    return this.root;
  }

  async getRoot() {
    return this.ensureRoot();
  }

  private async readRegistry(): Promise<string[]> {
    await this.ensureRoot();

    if (!(await fs.pathExists(this.registryFile))) {
      return [];
    }

    try {
      const data = await fs.readJson(this.registryFile);
      if (!Array.isArray(data)) {
        return [];
      }

      return data.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    } catch {
      return [];
    }
  }

  private async writeRegistry(projectRoots: string[]) {
    await this.ensureRoot();

    const normalized = Array.from(
      new Set(
        projectRoots
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => path.normalize(item))
      )
    );

    await fs.writeJson(this.registryFile, normalized, { spaces: 2 });
  }

  private async registerProjectRoot(projectRoot: string) {
    const current = await this.readRegistry();
    current.push(projectRoot);
    await this.writeRegistry(current);
  }

  private async unregisterProjectRoot(projectRoot: string) {
    const current = await this.readRegistry();
    const normalizedTarget = path.normalize(projectRoot);
    await this.writeRegistry(current.filter((item) => path.normalize(item) !== normalizedTarget));
  }

  private async collectProjectRoots(): Promise<string[]> {
    await this.ensureRoot();

    const roots = new Set<string>();

    if (await fs.pathExists(this.root)) {
      const names = await fs.readdir(this.root);
      for (const name of names) {
        if (name === REGISTRY_FILE) continue;
        roots.add(path.join(this.root, name));
      }
    }

    const registryRoots = await this.readRegistry();
    for (const projectRoot of registryRoots) {
      roots.add(projectRoot);
    }

    const validRoots: string[] = [];
    for (const projectRoot of roots) {
      try {
        const stat = await fs.stat(projectRoot);
        if (stat.isDirectory()) {
          validRoots.push(projectRoot);
        }
      } catch {
        continue;
      }
    }

    return validRoots;
  }

  private async writeProject(project: ProjectData) {
    const projectRoot = project.rootPath;
    const chaptersDir = path.join(projectRoot, 'chapters');
    const charactersDir = path.join(projectRoot, 'characters');
    const worldDir = path.join(projectRoot, 'worldbuilding');
    const timelineDir = path.join(projectRoot, 'timeline');
    const foreshadowDir = path.join(projectRoot, 'foreshadowing');
    const notesDir = path.join(projectRoot, 'notes');
    const assetsDir = path.join(projectRoot, 'assets');
    const snapshotsDir = path.join(projectRoot, '_snapshots');

    await Promise.all([
      fs.ensureDir(chaptersDir),
      fs.ensureDir(charactersDir),
      fs.ensureDir(worldDir),
      fs.ensureDir(timelineDir),
      fs.ensureDir(foreshadowDir),
      fs.ensureDir(notesDir),
      fs.ensureDir(assetsDir),
      fs.ensureDir(snapshotsDir)
    ]);

    const meta = {
      id: project.id,
      title: project.title,
      description: project.description,
      coverStyle: project.coverStyle,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      totalWords: project.totalWords,
      completedChapters: project.completedChapters,
      plannedChapters: project.plannedChapters,
      rootPath: project.rootPath,
      dashboard: project.dashboard,
      settings: project.settings,
      outline: project.outline,
      chapterIndex: project.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        status: chapter.status,
        outlineNodeId: chapter.outlineNodeId
      })),
      characterIds: project.characters.map((item) => item.id),
      worldEntryIds: project.worldEntries.map((item) => item.id),
      timelineIds: project.timelines.map((item) => item.id),
      foreshadowingIds: project.foreshadowing.map((item) => item.id),
      noteIds: project.notes.map((item) => item.id)
    };

    await fs.writeJson(path.join(projectRoot, META_FILE), meta, { spaces: 2 });

    await Promise.all(
      project.chapters.map(async (chapter) => {
        await fs.writeJson(path.join(chaptersDir, `${chapter.id}.json`), chapter, { spaces: 2 });
        await fs.writeFile(path.join(chaptersDir, `${chapter.id}.md`), chapter.markdown, 'utf-8');
      })
    );

    await Promise.all(
      project.characters.map((item) =>
        fs.writeJson(path.join(charactersDir, `${item.id}.json`), item, { spaces: 2 })
      )
    );
    await Promise.all(
      project.worldEntries.map((item) =>
        fs.writeJson(path.join(worldDir, `${item.id}.json`), item, { spaces: 2 })
      )
    );
    await Promise.all(
      project.timelines.map((item) =>
        fs.writeJson(path.join(timelineDir, `${item.id}.json`), item, { spaces: 2 })
      )
    );
    await Promise.all(
      project.foreshadowing.map((item) =>
        fs.writeJson(path.join(foreshadowDir, `${item.id}.json`), item, { spaces: 2 })
      )
    );
    await Promise.all(
      project.notes.map((item) =>
        fs.writeJson(path.join(notesDir, `${item.id}.json`), item, { spaces: 2 })
      )
    );
  }

  private async readProject(projectRoot: string): Promise<ProjectData | null> {
    const metaPath = path.join(projectRoot, META_FILE);
    if (!(await fs.pathExists(metaPath))) {
      return null;
    }

    const meta = await fs.readJson(metaPath);

    const readJsonArray = async <T>(dir: string): Promise<T[]> => {
      if (!(await fs.pathExists(dir))) return [];
      const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.json'));
      const items = await Promise.all(files.map((file) => fs.readJson(path.join(dir, file))));
      return items as T[];
    };

    const chapters = await readJsonArray<ChapterDocument>(path.join(projectRoot, 'chapters'));
    const characters = await readJsonArray<CharacterProfile>(path.join(projectRoot, 'characters'));
    const worldEntries = await readJsonArray<WorldEntry>(path.join(projectRoot, 'worldbuilding'));
    const timelines = await readJsonArray<TimelineData>(path.join(projectRoot, 'timeline'));
    const foreshadowing = await readJsonArray<ForeshadowingItem>(path.join(projectRoot, 'foreshadowing'));
    const notes = await readJsonArray<NoteCard>(path.join(projectRoot, 'notes'));

    return {
      ...meta,
      rootPath: projectRoot,
      chapters: chapters.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      characters,
      worldEntries,
      timelines,
      foreshadowing,
      notes,
      settings: meta.settings ?? defaultSettings(projectRoot)
    } as ProjectData;
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const projectRoots = await this.collectProjectRoots();

    const loaded = await Promise.all(
      projectRoots.map(async (projectRoot) => {
        try {
          return await this.readProject(projectRoot);
        } catch {
          return null;
        }
      })
    );

    return loaded
      .filter(Boolean)
      .map((project) => {
        const current = project as ProjectData;
        return {
          id: current.id,
          title: current.title,
          description: current.description,
          coverStyle: current.coverStyle,
          createdAt: current.createdAt,
          updatedAt: current.updatedAt,
          totalWords: current.totalWords,
          completedChapters: current.completedChapters,
          plannedChapters: current.plannedChapters,
          rootPath: current.rootPath
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createProject(input: CreateProjectInput): Promise<ProjectData> {
    const root = input.location || (await this.ensureRoot());
    await fs.ensureDir(root);

    const safeName = input.title.replace(/[\\/:*?"<>|]/g, '').trim() || '未命名项目';
    const folderName = `${safeName}_${randomUUID().slice(0, 8)}`;
    const projectRoot = path.join(root, folderName);

    await fs.ensureDir(projectRoot);

    const project = makeSampleProject(projectRoot, safeName);
    if (input.description) {
      project.description = input.description;
    }

    await this.writeProject(project);
    await this.registerProjectRoot(projectRoot);

    return project;
  }

  async getProject(projectId: string): Promise<ProjectData> {
    const all = await this.listProjects();
    const target = all.find((item) => item.id === projectId);

    if (!target) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const project = await this.readProject(target.rootPath);
    if (!project) {
      throw new Error(`Project data missing: ${projectId}`);
    }

    return project;
  }

  private recalc(project: ProjectData) {
    project.totalWords = project.chapters.reduce((sum, chapter) => sum + countWords(chapter.markdown), 0);
    project.completedChapters = project.chapters.filter((chapter) => chapter.status === '已完成').length;
    project.plannedChapters = Math.max(project.chapters.length, this.countOutlineNodes(project.outline, 'chapter'));
    project.updatedAt = new Date().toISOString();
    project.dashboard.todayWords = Math.max(project.dashboard.todayWords, project.totalWords % 5000);
  }

  private countOutlineNodes(nodes: OutlineNode[], type: OutlineNode['type']): number {
    let total = 0;
    for (const node of nodes) {
      if (node.type === type) total += 1;
      total += this.countOutlineNodes(node.children, type);
    }
    return total;
  }

  async updateOutline(projectId: string, outline: OutlineNode[]) {
    const project = await this.getProject(projectId);
    project.outline = outline;
    this.recalc(project);
    await this.writeProject(project);
    return project;
  }

  async upsertChapter(projectId: string, payload: ChapterDocument) {
    const project = await this.getProject(projectId);
    const index = project.chapters.findIndex((item) => item.id === payload.id);
    const updated = {
      ...payload,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      project.chapters[index] = updated;
    } else {
      project.chapters.push(updated);
    }

    this.recalc(project);
    await this.writeProject(project);
    return updated;
  }

  async upsertCharacter(projectId: string, payload: CharacterProfile) {
    const project = await this.getProject(projectId);
    const index = project.characters.findIndex((item) => item.id === payload.id);

    if (index >= 0) {
      project.characters[index] = { ...payload, updatedAt: new Date().toISOString() };
    } else {
      project.characters.push(payload);
    }

    this.recalc(project);
    await this.writeProject(project);
    return payload;
  }

  async upsertWorldEntry(projectId: string, payload: WorldEntry) {
    const project = await this.getProject(projectId);
    const index = project.worldEntries.findIndex((item) => item.id === payload.id);

    if (index >= 0) {
      project.worldEntries[index] = { ...payload, updatedAt: new Date().toISOString() };
    } else {
      project.worldEntries.push(payload);
    }

    this.recalc(project);
    await this.writeProject(project);
    return payload;
  }

  async upsertTimeline(projectId: string, payload: TimelineData) {
    const project = await this.getProject(projectId);
    const index = project.timelines.findIndex((item) => item.id === payload.id);

    if (index >= 0) {
      project.timelines[index] = payload;
    } else {
      project.timelines.push(payload);
    }

    this.recalc(project);
    await this.writeProject(project);
    return payload;
  }

  async upsertForeshadowing(projectId: string, payload: ForeshadowingItem) {
    const project = await this.getProject(projectId);
    const index = project.foreshadowing.findIndex((item) => item.id === payload.id);

    if (index >= 0) {
      project.foreshadowing[index] = payload;
    } else {
      project.foreshadowing.push(payload);
    }

    this.recalc(project);
    await this.writeProject(project);
    return payload;
  }

  async upsertNote(projectId: string, payload: NoteCard) {
    const project = await this.getProject(projectId);
    const index = project.notes.findIndex((item) => item.id === payload.id);

    if (index >= 0) {
      project.notes[index] = { ...payload, updatedAt: new Date().toISOString() };
    } else {
      project.notes.push(payload);
    }

    this.recalc(project);
    await this.writeProject(project);
    return payload;
  }

  async updateSettings(projectId: string, settings: ProjectData['settings']) {
    const project = await this.getProject(projectId);
    project.settings = settings;
    this.recalc(project);
    await this.writeProject(project);
    return settings;
  }

  async removeProject(projectId: string) {
    const project = await this.getProject(projectId);
    await fs.remove(project.rootPath);
    await this.unregisterProjectRoot(project.rootPath);
    return { ok: true };
  }

  async duplicateProject(projectId: string) {
    const project = await this.getProject(projectId);
    const destination = path.join(
      path.dirname(project.rootPath),
      `${project.title}_副本_${randomUUID().slice(0, 6)}`
    );

    const clone: ProjectData = {
      ...project,
      id: randomUUID(),
      title: `${project.title} 副本`,
      rootPath: destination,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.writeProject(clone);
    await this.registerProjectRoot(destination);

    return { ok: true, destination };
  }

  async createSnapshot(projectId: string) {
    const project = await this.getProject(projectId);
    const fileName = `${project.title}_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const outputPath = path.join(project.rootPath, '_snapshots', fileName);

    await fs.ensureDir(path.dirname(outputPath));

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.file(path.join(project.rootPath, META_FILE), { name: META_FILE });
      archive.directory(path.join(project.rootPath, 'chapters'), 'chapters');
      archive.directory(path.join(project.rootPath, 'characters'), 'characters');
      archive.directory(path.join(project.rootPath, 'worldbuilding'), 'worldbuilding');
      archive.directory(path.join(project.rootPath, 'timeline'), 'timeline');
      archive.directory(path.join(project.rootPath, 'foreshadowing'), 'foreshadowing');
      archive.directory(path.join(project.rootPath, 'notes'), 'notes');
      archive.directory(path.join(project.rootPath, 'assets'), 'assets');
      archive.finalize();
    });

    return { ok: true, outputPath };
  }
}