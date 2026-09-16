# Koven · 项目知识图谱（路由表）

> 本文档是项目状态的**单点真相源（Single Source of Truth）入口**——**路由表**，详细内容全部按主题域拆分在 `knowledge/` 目录。
> **路由制使用规约**（对应 AGENTS.md 铁律 9）：
> 1. 每次会话开始，先读本路由表（全文）；
> 2. 根据任务涉及的领域，**按需阅读** `knowledge/` 下对应分片（需要什么读什么，禁止全量阅读全部分片，也**禁止只读路由表不读分片**）；
> 3. 修改代码后同步更新对应分片（见 §5 更新指引）。

## 1. 项目速览

| 项 | 值 |
|---|---|
| 名称 | Koven |
| 形态 | Windows-only Electron 桌面应用（electron-vite，主进程 / preload / 渲染进程分离） |
| 定位 | 从零开始的桌面壳：安全模型与工程约定先于业务 |
| 技术栈 | Electron 44.2.0 + React 19 + TypeScript 5 / npm / Tailwind CSS 4 / Radix UI / Zustand 5 / electron-vite 开发打包 + electron-builder Windows 安装包 |
| 已实现 | 窗口壳（WCO 标题栏 / 托盘 / 1024×700）+ 侧栏与 keepalive 导航（草稿页除外）+ 能力核骨架 + 窄 IPC + 壳快照/偏好 JSON + **项目/任务 SQLite（node:sqlite）** + 新建项目草稿→任务对话（**积木化 mock 多轮流式**）+ 完成提示音 + 明暗双主题 + 双语 + 首选项 + 关于 + fs-browser + 质量门 + Windows 打包 + 主进程日志 |
| 占位 | 检查更新/帮助仍占位；对话消息未持久化；远程埋点未做；真实模型流式未接；Markdown 围栏针对性渲染（含 mermaid 图）延后 |
| 质量门槛 | 见 §3 |

## 2. 路由表（模块化）

| 路由 | 分片文件 | 覆盖内容 | 何时读 |
|---|---|---|---|
| 01 | `knowledge/01-overview.md` | 项目定位 / 技术栈 / 目录结构 / 架构总览（Mermaid） | 新会话建立上下文；依赖选型、版本核对、整体目录；增量架构细节改读 10 |
| 02 | `knowledge/02-modules-main.md` | 主进程：Windows 校验、路径隔离、`BrowserWindow`、IPC handle、存储/日志 | 改窗口、落盘路径、主进程生命周期、新 IPC 实现 |
| 03 | `knowledge/03-modules-preload.md` | preload：`contextBridge`、窄 API、sandbox 约束 | 改 `window.koven`、preload 依赖、sandbox |
| 04 | `knowledge/04-modules-renderer.md` | 渲染进程：React 入口、页面、Radix 组件、store | 改 UI、加页面/组件、改 Zustand store |
| 05 | `knowledge/05-patterns-core.md` | 核心心智：三进程边界 / 共享类型 / 禁止事项 / ESLint 边界 | 新建模块时判断代码该落哪一端 |
| 06 | `knowledge/06-patterns-state.md` | 状态：Zustand / IPC / JSON 迁移 / 不可写回落 | 加客户端状态、持久化、跨窗口数据 |
| 07 | `knowledge/07-patterns-build.md` | 工程：electron-vite / builder / confine / **scripts 清单** / 测试与 lint | 改构建、打包、TS、缓存隔离、加脚本、排障工程问题 |
| 08 | `knowledge/08-pitfalls.md` | 踩坑与解法（现象 → 根因 → 修复） | 遇到报错、行为异常、排障 |
| 09 | `knowledge/09-ui-spec.md` | UI 规范：Radix + Tailwind + 文案（AGENTS.md 铁律 15） | 改界面、加组件、写给使用者看的文案 |
| 10 | `knowledge/10-architecture.md` | 增量架构：能力核 / 能力包 / 注册表 / 文件预算 / 八种加法 | 新建功能、拆文件、加 IPC、加页面、担心膨胀 |

## 3. 质量门槛（提交前必过）

```bash
npm run check
```

> `check` = `typecheck`（两套 `tsc` + 文件预算 + 能力包三端契约）+ `lint`（ESLint）+ `test`（Vitest）。`build:win` 打包前跑 `check`。Agent 可跑 `npm test` / `npm run check` 而不启 Electron；真窗口须先获用户授权（`npm start`）。

## 4. 编号说明

本图谱从零编写，**没有**从其它项目继承的旧分片编号。不要去对照雪中豹的 02-app / 03-lib / Server Action 等条目。

## 5. 更新指引（路由制维护规约）

- 项目状态变化时，**更新对应分片**保持与代码一致；本路由表仅在结构/条目变化时更新（新增/合并分片、路由条目描述过期）
- 新窗口行为 / 路径隔离 / 主进程 IPC → `02-modules-main.md`（+ 视情况 `01-overview.md`）
- **新增或修改 IPC 能力包** → 至少更新 `02-modules-main.md`、`03-modules-preload.md`、`10-architecture.md`（持久化/状态变化再改 `06-patterns-state.md`）
- 改 preload / 暴露 API → `03-modules-preload.md` + 对应 `src/shared/capabilities/<name>.ts`
- 改 React 页面、Radix 组件、store → `04-modules-renderer.md`；状态范式变化 → `06-patterns-state.md`
- 新的进程边界约定 → `05-patterns-core.md`
- 新能力包 / 文件拆分 / 注册表 / 预算 → `10-architecture.md`
- 改构建、Tailwind、TS、confine、electron-builder、**scripts/** → `07-patterns-build.md`（含 scripts 清单表）
- 铁律 / Agent 行为约束 → 更新根目录 `AGENTS.md`（编号变动时同步本表引用）
- 出现新坑 → 补进 `08-pitfalls.md`（格式：现象 → 根因 → 修复）
- 分片内交叉引用直接写**分片文件名**（如 `05-patterns-core.md`）
- 优化方向/待办类文档可放 `knowledge/` 但**不进路由表**，除非用户要求纳入维护
- 不上「图谱过期」自动门禁（误报多）；靠 Agent 铁律 + 人工
