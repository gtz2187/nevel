import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service.js';
import type { AskAIInput, ExtractEntitiesInput } from '../../../shared/models.js';

@Injectable()
export class AiService {
  constructor(private readonly projectsService: ProjectsService) {}

  private async callOnlineModel(projectId: string, systemPrompt: string, userPrompt: string) {
    const project = await this.projectsService.getProject(projectId);
    const ai = project.settings.ai;

    if (!ai.apiBaseUrl || !ai.apiKey || !ai.model) {
      return null;
    }

    const endpoint = `${ai.apiBaseUrl.replace(/\/$/, '')}/chat/completions`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ai.apiKey}`
        },
        body: JSON.stringify({
          model: ai.model,
          temperature: ai.temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        return { error: `HTTP ${response.status}: ${text.slice(0, 160)}` };
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        return { error: '模型未返回有效文本内容' };
      }

      return { content };
    } catch (error: any) {
      return { error: error?.message || '在线模型请求失败' };
    } finally {
      clearTimeout(timer);
    }
  }

  async ask(input: AskAIInput) {
    const project = await this.projectsService.getProject(input.projectId);
    const chapterTitles = project.chapters.slice(0, 8).map((item) => item.title).join('、');

    const online = await this.callOnlineModel(
      input.projectId,
      '你是小说创作助手。请基于用户项目上下文给出结构化、可执行建议，输出中文。',
      `项目：${project.title}\n已知章节：${chapterTitles || '暂无'}\n\n用户问题：${input.question}`
    );

    if (online && 'content' in online) {
      return {
        answer: online.content,
        sources: project.chapters.slice(0, 3).map((chapter) => ({
          type: 'chapter',
          id: chapter.id,
          title: chapter.title
        }))
      };
    }

    const errorHint = online && 'error' in online ? `\n\n[在线模型未启用，原因：${online.error}]` : '';
    return {
      answer:
        `这是当前本地 AI 占位回答。\n\n` +
        `你问的是：${input.question}\n\n` +
        `我已读取项目《${project.title}》的基础内容。当前更适合优先参考的章节有：${chapterTitles || '暂无'}。\n\n` +
        `下一步建议：\n1. 先明确该问题属于人物 / 时间线 / 世界观 / 伏笔中的哪一类；\n2. 若需要正式接入大模型，可把这里替换为 LangChain / LangGraph 调用；\n3. 若要做真正 RAG，可在本服务中补向量索引与检索。` +
        errorHint,
      sources: project.chapters.slice(0, 3).map((chapter) => ({
        type: 'chapter',
        id: chapter.id,
        title: chapter.title
      }))
    };
  }

  async extract(input: ExtractEntitiesInput) {
    const project = await this.projectsService.getProject(input.projectId);
    const content = input.content || '';

    const online = await this.callOnlineModel(
      input.projectId,
      '你是实体提取助手。请从文本中提取人物、地点、组织、设定名词。只返回 JSON 数组，字段: name, type, excerpt。',
      `请从以下章节文本提取实体：\n${content.slice(0, 6000)}`
    );

    if (online && 'content' in online && typeof online.content === 'string') {
      try {
        const contentText = online.content;
        const start = contentText.indexOf('[');
        const end = contentText.lastIndexOf(']');
        if (start >= 0 && end > start) {
          const jsonText = contentText.slice(start, end + 1);
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed)) {
            const items = parsed
              .map((item) => ({
                name: String(item?.name ?? '').trim(),
                type: String(item?.type ?? '候选实体').trim(),
                excerpt: String(item?.excerpt ?? '').trim()
              }))
              .filter((item) => item.name)
              .slice(0, 20);
            return { items };
          }
        }
      } catch {
        // ignore parse errors and fallback
      }
    }

    const results: Array<{ name: string; type: string; excerpt: string }> = [];

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
