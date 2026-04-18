import type {
  AppSettings,
  ChapterDocument,
  CharacterProfile,
  DashboardStats,
  ForeshadowingItem,
  NoteCard,
  OutlineNode,
  ProjectData,
  TimelineData,
  WorldEntry
} from './/models.js';
import { randomUUID } from 'node:crypto';

const now = () => new Date().toISOString();

export function countWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-!\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return Array.from(plain.replace(/\s/g, '')).length;
}

export function defaultSettings(root: string): AppSettings {
  return {
    theme: 'dark',
    language: 'zh-CN',
    defaultProjectRoot: root,
    startBehavior: 'show-list',
    editor: {
      fontFamily: 'SF Pro Text, PingFang SC, Microsoft YaHei, sans-serif',
      fontSize: 17,
      lineHeight: 1.9,
      autoSaveSeconds: 30,
      focusModeBackground: 'dark'
    },
    ai: {
      provider: '通义千问',
      apiKeyHint: '',
      model: 'qwen-plus',
      temperature: 0.7,
      tone: '专业严谨',
      allowWeb: false
    },
    music: []
  };
}

export function defaultDashboard(chapterId: string): DashboardStats {
  return {
    currentStreak: 3,
    todayWords: 1288,
    dailyGoal: 3000,
    recentChapterIds: [chapterId],
    todos: [
      {
        id: randomUUID(),
        title: '补全主角第一次失手的心理后劲',
        done: false,
        children: []
      },
      {
        id: randomUUID(),
        title: '把第一卷末尾的反转伏笔再提前一章',
        done: false,
        children: []
      }
    ],
    ideas: [
      '让“父亲打的那把剑”在第一卷后半段第一次真正见血。',
      '把弟弟的敏感和早慧写成一种不直接讨喜、但很抓人的观察力。',
      '反派第一次出场不要报姓名，只留下一个动作特征。'
    ]
  };
}

export function makeSampleProject(root: string, title: string): ProjectData {
  const chapterId = randomUUID();
  const volumeNodeId = randomUUID();
  const chapterNodeId = randomUUID();
  const heroId = randomUUID();
  const worldId = randomUUID();
  const timelineId = randomUUID();
  const eventId = randomUUID();
  const foreshadowId = randomUUID();
  const noteId = randomUUID();
  const id = randomUUID();
  const createdAt = now();

  const outline: OutlineNode[] = [
    {
      id: volumeNodeId,
      type: 'volume',
      title: '第一卷：启程',
      status: '写作中',
      targetWords: 50000,
      summary: '主角的起点、家与剑、第一场不得不出手的冲突。',
      children: [
        {
          id: chapterNodeId,
          type: 'chapter',
          title: '第1章：那把剑',
          status: '写作中',
          targetWords: 3500,
          summary: '父亲把剑交到主角手里，主角第一次真正意识到“保护”这件事。',
          chapterId,
          children: []
        }
      ]
    }
  ];

  const chapters: ChapterDocument[] = [
    {
      id: chapterId,
      title: '第1章：那把剑',
      outlineNodeId: chapterNodeId,
      status: '写作中',
      targetWords: 3500,
      markdown: `# 第1章：那把剑

父亲把那把剑递过来的时候，天还没有完全亮。

院子里有昨夜的潮气，木盆边结着一点薄薄的水痕。主角伸手接住时，先觉得沉，接着才是凉。那不是能让人一眼惊艳的剑，甚至算不上精巧，可握在手里时，却有一种很笨、很实在的分量。

“拿稳。”父亲说。

他没说这把剑攒了多久，也没说自己少买了多少东西，只像平常一样，把最重的话压在最短的一句里。

主角低头看剑，第一反应不是自己终于有了兵器，而是——以后若真有事，他得站在弟弟前头。`,
      tags: ['开篇', '家庭', '剑'],
      characterIds: [heroId],
      locationIds: [worldId],
      timelineEventIds: [eventId],
      foreshadowingIds: [foreshadowId],
      notes: '把父亲的沉和主角的“接”写得更克制一些。',
      createdAt,
      updatedAt: createdAt,
      versions: []
    }
  ];

  const characters: CharacterProfile[] = [
    {
      id: heroId,
      name: '主角',
      aliases: [],
      gender: '男',
      age: '16岁',
      race: '人类',
      occupation: '学徒 / 少年剑客',
      faction: '主角方',
      importance: '主角',
      appearance: '不显眼，不张扬，肩背还没完全长开，但站姿已经学会下意识挡在别人前面。',
      personalityTags: ['能扛', '克制', '慢热', '责任感'],
      background: '普通家庭长子。父母都只是普通人，父亲靠手艺和苦力撑家，母亲把家里里外外稳住。他最初想练剑，只是为了以后能护住弟弟。',
      skills: [
        {
          id: randomUUID(),
          name: '基础剑术',
          level: '入门',
          description: '动作还不漂亮，但稳。'
        }
      ],
      relationships: [],
      notes: '避免写成天降挂；他的成长重心是责任与决断。',
      appearanceCount: 1,
      firstAppearanceChapterId: chapterId,
      latestAppearanceChapterId: chapterId,
      createdAt,
      updatedAt: createdAt
    }
  ];

  const worldEntries: WorldEntry[] = [
    {
      id: worldId,
      name: '青石巷',
      aliases: [],
      categories: ['地理/国家'],
      summary: '主角一家居住的小巷，旧、窄、普通，但像活人会住的地方。',
      content: '巷口早上会有卖热饼的摊子，雨天青石发滑，邻里之间说不上亲密，但互相都认得脸。',
      linkedEntryIds: [],
      tags: ['主角故乡', '开篇地点'],
      createdAt,
      updatedAt: createdAt
    }
  ];

  const timelines: TimelineData[] = [
    {
      id: timelineId,
      name: '主线剧情',
      color: '#7c8cff',
      description: '主角正式踏上剑客之路之前后的主线。',
      isPrimary: true,
      events: [
        {
          id: eventId,
          title: '父亲交剑',
          at: '主角16岁初春清晨',
          type: '剧情事件',
          description: '父亲将攒钱打造的剑交给主角，成为主角真正进入“保护者”身份的起点。',
          characterIds: [heroId],
          placeIds: [worldId],
          chapterIds: [chapterId],
          previousEventIds: [],
          nextEventIds: [],
          tags: ['起点']
        }
      ]
    }
  ];

  const foreshadowing: ForeshadowingItem[] = [
    {
      id: foreshadowId,
      title: '父亲为何执意要打一把剑',
      description: '父亲并非因为主角天赋，而是看出了外面的世道已经开始变坏。',
      plantedChapterId: chapterId,
      plannedRevealChapterId: chapterId,
      actualRevealChapterId: undefined,
      status: '未揭示',
      tags: ['家庭线', '时代变局']
    }
  ];

  const notes: NoteCard[] = [
    {
      id: noteId,
      title: '第一卷气质',
      content: '不要写成苦情，要写成普通人咬牙活着的硬感。',
      color: '#f5b8ff',
      x: 40,
      y: 30,
      width: 280,
      height: 180,
      createdAt,
      updatedAt: createdAt
    }
  ];

  const dashboard = defaultDashboard(chapterId);

  return {
    id,
    title,
    description: '从零开始创建的本地小说项目',
    coverStyle: 'purple-dawn',
    createdAt,
    updatedAt: createdAt,
    totalWords: countWords(chapters[0].markdown),
    completedChapters: 0,
    plannedChapters: 1,
    rootPath: root,
    dashboard,
    settings: defaultSettings(root),
    outline,
    chapters,
    characters,
    worldEntries,
    timelines,
    foreshadowing,
    notes
  };
}
