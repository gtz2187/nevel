import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service.js';
import type {
  AskAIInput,
  ExtractEntitiesInput,
  RecommendEntitiesInput,
  RecommendEntityItem
} from '../../../shared/models.js';

@Injectable()
export class AiService {
  constructor(private readonly projectsService: ProjectsService) {}

  private tokenize(text: string): string[] {
    return (text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1);
  }

  private overlapScore(source: string[], target: string[]): number {
    if (!source.length || !target.length) return 0;
    const sourceSet = new Set(source);
    const targetSet = new Set(target);
    let overlap = 0;
    for (const token of sourceSet) {
      if (targetSet.has(token)) overlap += 1;
    }
    return overlap / Math.max(sourceSet.size, 1);
  }

  async ask(input: AskAIInput) {
    const project = await this.projectsService.getProject(input.projectId);
    const chapterTitles = project.chapters.slice(0, 5).map((item) => item.title).join('、');
    return {
      answer:
        `这是当前本地 AI 占位回答。\n\n` +
        `你问的是：${input.question}\n\n` +
        `我已读取项目《${project.title}》的基础内容。当前更适合优先参考的章节有：${chapterTitles || '暂无'}。\n\n` +
        `下一步建议：\n1. 先明确该问题属于人物 / 时间线 / 世界观 / 伏笔中的哪一类；\n2. 若需要正式接入大模型，可把这里替换为 LangChain / LangGraph 调用；\n3. 若要做真正 RAG，可在本服务中补向量索引与检索。`,
      sources: project.chapters.slice(0, 3).map((chapter) => ({
        type: 'chapter',
        id: chapter.id,
        title: chapter.title
      }))
    };
  }

  async extract(input: ExtractEntitiesInput) {
    const project = await this.projectsService.getProject(input.projectId);
    const results: Array<{ name: string; type: string; excerpt: string }> = [];
    const content = input.content || '';

    for (const character of project.characters) {
      if (content.includes(character.name)) {
        results.push({
          name: character.name,
          type: '人物',
          excerpt: `${character.name} 已在章节文本中出现。`
        });
      }
    }

    for (const place of project.worldEntries) {
      if (content.includes(place.name)) {
        results.push({
          name: place.name,
          type: '地点/设定',
          excerpt: `${place.name} 已在章节文本中出现。`
        });
      }
    }

    if (!results.length) {
      const match = content.match(/“([^”]{2,8})”/);
      if (match) {
        results.push({
          name: match[1],
          type: '候选实体',
          excerpt: '这是基于引号片段提取出的占位候选实体。'
        });
      }
    }

    return { items: results };
  }

  async recommendCharacters(input: RecommendEntitiesInput) {
    const project = await this.projectsService.getProject(input.projectId);
    const limit = Math.max(1, Math.min(input.limit ?? 8, 30));
    const selected = new Set(input.selectedCharacterIds ?? []);
    const recentChapters = [...project.chapters]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);
    const recentChapterIds = new Set(recentChapters.map((item) => item.id));
    const contextTokens = this.tokenize(input.content);

    const rankList: RecommendEntityItem[] = project.characters.map((character) => {
      let score = 0;
      const reasons: string[] = [];

      if (selected.has(character.id)) {
        score += 6;
        reasons.push('当前章节已选择');
      }

      const recentAppearance = recentChapters.filter((chapter) =>
        (chapter.characterIds || []).includes(character.id)
      ).length;
      if (recentAppearance > 0) {
        score += Math.min(4, recentAppearance * 1.5);
        reasons.push(`最近章节高频出场（${recentAppearance}）`);
      }

      const profileText = [
        character.name,
        character.aliases.join(' '),
        character.background,
        character.personalityTags.join(' '),
        character.occupation,
        character.faction
      ]
        .join(' ')
        .trim();
      const semantic = this.overlapScore(contextTokens, this.tokenize(profileText));
      if (semantic > 0) {
        const semanticScore = Number((semantic * 8).toFixed(2));
        score += semanticScore;
        reasons.push('与当前段落语义相关');
      }

      const globalUsage = project.chapters.filter((chapter) =>
        (chapter.characterIds || []).includes(character.id)
      ).length;
      if (globalUsage > 0) {
        score += Math.min(3, globalUsage / 3);
        reasons.push(`全局引用 ${globalUsage} 次`);
      }

      if (input.chapterId && recentChapterIds.has(input.chapterId)) {
        score += 0.2;
      }

      if (reasons.length === 0) {
        reasons.push('基础候选');
      }

      return {
        id: character.id,
        name: character.name,
        score: Number(score.toFixed(2)),
        reasons
      };
    });

    const items = rankList
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit);

    return { items };
  }
}
