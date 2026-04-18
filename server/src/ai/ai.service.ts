import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service.js';
import type { AskAIInput, ExtractEntitiesInput } from '../../../shared/models.js';

@Injectable()
export class AiService {
  constructor(private readonly projectsService: ProjectsService) {}

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
}
