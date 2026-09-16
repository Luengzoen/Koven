# Koven 知识图谱分片：04 渲染进程

> 路由：`knowledge/04-modules-renderer.md`（路由表 knowledge-graph.md 的 04 号分片）
> 覆盖内容：React 入口、页面、Radix 组件、store
> 何时读：改 UI、加页面/组件、改 Zustand store

## 1. 入口

| 文件 | 作用 |
|---|---|
| `src/renderer/index.html` | 挂 `#root`；CSP；开发入口 `/src/main.tsx` |
| `src/renderer/splash.html` | 启动 Splash（无 React）；入口 `/src/splash.ts` |
| `src/renderer/src/splash.ts` / `splash.css` | 「Koven」Bahnschrift 渐变字 + 斜流光；`splash-exit` 关电视 CRT |
| `src/renderer/src/main.tsx` | `createRoot` + `StrictMode` + `App` |
| `src/renderer/src/assets/main.css` | Tailwind v4 入口 |
| `src/renderer/src/app/App.tsx` | hydrate 后挂 `AppShell`；首帧后 `shell.notifyUiReady()` |
| `src/renderer/src/shell/app-shell.tsx` | 标题栏 + 可折叠侧栏 + 宽度手柄 + topbar + keepalive 主区 |
| `src/renderer/src/shell/title-bar.tsx` | WCO 自定义标题栏 |
| `src/renderer/src/shell/page-topbar.tsx` | 页面顶栏：侧栏展开/收起、可选返回（`chrome.showBack`）、居中标题 |
| `src/renderer/src/shell/shell-layout-store.ts` | 侧栏开合与宽度（默认/最小 250，最大 600；收起不改宽度） |
| `src/renderer/src/shell/navigation-store.ts` | `activeId` / `sidebarSelectedId` / `backStack` / `openFromSidebar` / `open` / `back` |
| `src/renderer/src/shell/create-navigation-store.ts` | 导航 store 工厂（含返回栈；不落盘） |
| `src/renderer/src/shell/keep-alive-outlet.tsx` | 已访问页保活；**草稿页 `overview:starred` 不进 `visitedIds`，单独渲染且离开即毁** |
| `src/renderer/src/shell/draft-store.ts` / `draft-page.ts` | 新建项目 vs 项目加号草稿（`projectId` 决定是否显示项目目录选择） |
| `src/renderer/src/shell/session-persistence.ts` | hydrate（含 projects）+ 写回 shell/preferences |
| `src/renderer/src/shell/preferences-store.ts` | 主题/语言/general（字体族·字号·关闭行为·完成提示音落盘；语言驱动 `useT`） |
| `src/renderer/src/shell/completion-sound.ts` | 完成提示音单例播放器（同时只播一个） |
| `src/renderer/src/shell/play-task-complete-sound.ts` | 与侧栏 finished badge 同机触发播放 |
| `src/renderer/src/shell/use-t.ts` | 订阅 `locale`，返回 `t(key)` |
| `src/renderer/src/shell/use-document-lang.ts` | 同步 `html[lang]` |
| `src/renderer/src/shell/theme-resolve.ts` | `ThemePreference` → 实际 light/dark |
| `src/renderer/src/shell/apply-theme.ts` | 写 `html.dark`；可选圆形外扩；`cleanupThemeCircleArtifacts` 清残留遮罩 |
| `src/renderer/src/shell/apply-typography.ts` | 写 `--font-scale` / `--font-sans-family` |
| `src/renderer/src/shell/use-theme-sync.ts` | 订阅偏好与系统配色，无动画同步 |
| `src/renderer/src/components/ui/theme-segment.tsx` | 三档主题 segment（系统/浅/深） |
| `src/renderer/src/shell/sidebar/` | Overview / 搜索（双模式）/ Projects 树（分页更多、状态显隐、重命名/归档/删除、超长标题悬停滚动、项目目录/任务标题用原生 `title`）/ 底部设置 |
| `src/renderer/src/routes.ts` | Overview + 首选项静态注册；`task:<id>` **动态**解析为 `TaskChatPage` |
| `src/renderer/src/assets/koven.png` | logo |
| `src/renderer/src/capabilities/preferences/` | 首选项导航页（General / System；通用含完成提示音下拉+试听；内部分类经壳快照持久化） |
| `src/renderer/src/capabilities/app-info/` | 关于对话框 |
| `src/renderer/src/capabilities/new-project/` | 草稿页：hero + Prompt；首发后创建项目/任务并切到任务页 |
| `src/renderer/src/capabilities/projects/` | `projects-store`（hydrate / 分页 / 搜索） |
| `src/renderer/src/capabilities/task-chat/` | 任务对话页 + mock 流式 + 忙碌态 composer；流结束置 `finished` 时若非当前任务页则播完成提示音 |

CSP：`default-src 'self'`；`style-src` 含 `'unsafe-inline'`（Vite/Radix）；`connect-src` 含 `ws:`/`wss:`（HMR）。收紧 CSP 时先读 `08-pitfalls.md`。

## 2. 别名

渲染代码用 `@renderer/*` → `src/renderer/src/*`，跨进程类型用 `@shared/*`。Vite 与 `tsconfig.web.json` 必须同时有对应 alias/paths。

## 3. UI 层

| 路径 | 内容 |
|---|---|
| `components/ui/button.tsx` | Radix `Slot` + `cva`（含 primary） |
| `components/ui/dialog.tsx` | `@radix-ui/react-dialog` |
| `components/ui/dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu`（Content 须 `z-50`；统一 `koven-menu-in/out` 进出场） |
| `components/ui/separator.tsx` | `@radix-ui/react-separator` |
| `components/ui/theme-segment.tsx` | 主题三档 segment（悬停用原生 `title`） |
| `components/ui/slider.tsx` | 离散档位 range 滑条 |
| `components/ui/switch.tsx` | 二态开关（左关右开） |
| `components/ui/focus-frame.tsx` | 编辑框 0.5px focus 发丝亮边容器（`input`/`textarea` 必包） |
| `components/ui/search-field.tsx` | 搜索框 + 自绘清除钮（替代原生 clear） |
| `components/ui/popover.tsx` | `@radix-ui/react-popover`（Content `z-50`；轻微弹性 `koven-popover-in/out`；可嵌复杂内容） |
| `components/fs-browser/` | 访达式分栏选择：`FileBrowser` + 前往栏 + 开合图标 + `.lnk` 壳图标；可下钻项（目录/卷/此电脑）行尾右箭头；悬停原生 `title` 显示全路径（「此电脑」用 i18n 名）；列数变深时横向滚到最右；路径链祖先伪选中用 `bg-accent`（暗色 `muted===card`，勿用 `bg-muted`）并纵向滚入可视；入参见 `file-browser-types.ts` |
| `lib/cn.ts` | `clsx` + `tailwind-merge` |
| `capabilities/preferences/` | 首选项导航页（General / System） |
| `capabilities/app-info/` | 关于对话框 |
| `capabilities/new-project/` | 草稿 + Prompt；项目目录 Popover；流式忙碌时禁用模式/回形针/项目目录/权限 |
| `capabilities/projects/` | 侧栏数据 store（IPC → SQLite） |
| `capabilities/task-chat/` | 任务对话页；mock 思考/正文流式；docked composer |

新增可复用控件放 `components/ui/`；页面与业务组合放 `capabilities/<name>/`。壳导航与侧栏放 `shell/`。规范见 `09-ui-spec.md`、`10-architecture.md`。

壳级导航用 `navigation-store`；业务 Zustand 仍一包一店。

## 4. 当前页面行为

- 启动先 `hydrateSession`（壳快照 + preferences）再挂 `AppShell`；**`hydrateProjects` 后台进行**（超时不挡首屏）。`AppReady` 双 `rAF` 后 `notifyUiReady`，供主进程结束 Splash。
- 默认/恢复：Overview 或上次 `activePageId`；任务已删/已归档则回落首页；侧栏高亮用 `sidebarSelectedId`。
- 「新建项目」草稿页 **不 keepalive**；任务页 `task:<id>` 可保活。
- 首条发送须已选项目目录（项目加号草稿除外）；标题=前 15 字，项目名=文件夹名；**同项目目录归入已有项目（去重）**；发送后选中对应任务。
- 侧栏：项目全量固定序；任务每页 10 +「更多」；状态徽标仅非当前任务显示；超长任务标题悬停头尾循环滚动；项目/任务悬停用原生 `title`（路径 / 标题）；删光或归档光未归档任务后移除空项目；搜索 debounce + 骨架流光 + 命中高亮 + 搜索结果亦可「更多」。
- topbar：任务标题订阅 `projects-store`；`preferences` 开返回。
- 壳 UI 与偏好仍写 JSON；项目/任务写 SQLite。
- 仍不上 react-router。

产品功能不要堆进 `shell/sidebar`；业务进能力包。
