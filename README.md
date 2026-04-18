# 墨者（从零重做版）

这是根据你这次提供的 markdown 需求，**从零开始重新搭建**的一套 Electron + Vue 3 + NestJS 本地小说创作桌面应用工程。

## 已落地的核心内容

- 项目列表页：新建、打开、删除、复制、快速进入
- 工作台总览：连续写作、目标进度、最近章节、待办、灵感卡片
- 左侧主结构树：仪表盘 / 正文 / 人物 / 时间线 / 世界观 / 大纲 / 伏笔 / 灵感便签板 / 设置
- 大纲与章节系统：卷-章-节结构、章节状态、目标字数、章节选择
- 正文编辑器：Markdown 编辑 / 预览切换 / 自动保存 / 字数统计 / 历史版本
- 人物系统：基础资料、性格标签、关系描述、出场记录占位
- 世界观词条系统：分类、摘要、正文、关联词条
- 时间线系统：时间线、事件、人物/地点/章节关联
- 伏笔系统：埋下章节、计划揭示章节、实际揭示章节、状态
- 灵感便签板：便签卡片
- 设置中心：主题、字体、默认项目位置、自动保存、AI 配置、音频列表
- 本地文件持久化：每个项目写入独立目录，结构接近需求文档中的项目格式
- NestJS 本地服务：项目 CRUD、章节保存、实体模块 CRUD、AI 占位接口
- Electron 主进程：窗口、基础 IPC、目录选择、通知、导出快照接口预留
- AI 上下文推荐（已补全）：章节编辑器支持“一键 AI 推荐人物”，按“已选项/最近章节出场/语义重合/全局频次”综合排序

## 本轮补全与项目健康检查（2026-04-18）

- 通过 `npm run build` 验证了渲染进程、NestJS 服务、Electron 主进程均可成功构建。
- 通过 `npm run lint:types` 验证了 TypeScript 类型检查通过。
- 新增后端接口 `POST /api/ai/recommend-characters`，可根据章节上下文返回推荐人物及理由。
- 章节编辑器“本章设定”中新增“AI 推荐人物”按钮与推荐结果展示区域，用于补齐需求中“上下文感知选择器（智能排序）”的关键路径。

## 当前范围说明

这份工程优先保证**核心创作工作流可搭起来**。像真正的 RAG、向量库、Word/PDF/ePub 导出、复杂拓扑图、白噪音混音、桌宠、黑屋模式等高阶部分，这一版已经把：
- 数据结构
- 页面入口
- 接口位置
- 代码扩展位

都预留好了，但还没有全部做成最终生产版本。

## 目录结构

```text
electron/      Electron 主进程与 preload
server/        NestJS 本地服务
shared/        前后端共享类型
src/           Vue 3 渲染进程
```

## 本地运行

```bash
npm install
npm run dev
```

## 打包成安装包（给其他电脑安装）

> 建议在目标系统对应环境下打包（例如给 Windows 用户安装，尽量在 Windows 上执行 `dist:win`）。

```bash
# 1) 安装依赖
npm install

# 2) 全平台默认打包（根据当前系统生成可安装文件）
npm run dist

# 3) 指定平台打包（二选一/多选）
npm run dist:win
npm run dist:win:cn
npm run dist:mac
npm run dist:linux
```

打包成功后，安装包会出现在 `dist/` 目录中，常见文件例如：
- Windows: `dist/*.exe`
- macOS: `dist/*.dmg`
- Linux: `dist/*.AppImage` / `dist/*.deb`

在其他电脑上安装时，直接把对应安装包拷贝过去运行即可。

### Windows 打包常见失败（超时/连不上 GitHub）排查

如果你看到类似下面报错，通常不是代码问题，而是 `electron-builder` 下载 Electron 二进制时网络超时：

- `ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`
- `Get "https://github.com/electron/electron/releases/...": wsarecv ... failed to respond`

可按下面顺序处理：

```bash
# 方案 1（推荐，中国大陆网络）：使用 Electron 镜像
npm run dist:win:cn

# 方案 2：先设置镜像环境变量，再执行原命令（当前 CMD 窗口有效）
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm run dist:win
```

补充说明：
- `author is missed in the package.json` 只是警告，不会导致打包失败。
- 失败根因一般是网络连通性（代理/防火墙/GitHub 访问）而不是源码构建问题。

### 安装后黑屏排查（窗口打开但看不到 UI）

若安装包能启动但只看到黑色窗口，常见原因是 `file://` 场景下前端资源路径错误（例如资源仍以 `/assets/...` 绝对路径加载）。

当前项目已改为相对路径打包（`base: './'`），请按下面步骤重新构建并重装：

```bash
# 1) 清理旧产物
rd /s /q dist
rd /s /q dist-electron
rd /s /q dist-server

# 2) 重新打包
npm run dist:win:cn
```

## 默认本地项目结构

```text
MoZheProjects/
└── 项目名_uuid/
    ├── project.moz.json
    ├── chapters/
    ├── characters/
    ├── worldbuilding/
    ├── timeline/
    ├── foreshadowing/
    ├── notes/
    ├── assets/
    └── _snapshots/
```
