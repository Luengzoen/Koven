# Koven 知识图谱分片：04 渲染进程

> 路由：`knowledge/04-modules-renderer.md`（路由表 knowledge-graph.md 的 04 号分片）
> 覆盖内容：React 入口、页面、Radix 组件、store
> 何时读：改 UI、加页面/组件、改 Zustand store

## 1. 入口

| 文件 | 作用 |
|---|---|
| `src/renderer/index.html` | 挂 `#root`；CSP；开发入口 `/src/main.tsx` |
| `src/renderer/src/main.tsx` | `createRoot` + `StrictMode` + `App` |
| `src/renderer/src/assets/main.css` | Tailwind v4 入口 |
| `src/renderer/src/app/App.tsx` | 只挂 `AppShell`，禁止堆业务 |
| `src/renderer/src/shell/app-shell.tsx` | 标题栏 + 可折叠侧栏 + 宽度手柄 + topbar + keepalive 主区 |
| `src/renderer/src/shell/title-bar.tsx` | WCO 自定义标题栏 |
| `src/renderer/src/shell/page-topbar.tsx` | 页面顶栏：侧栏展开/收起、可选返回（`chrome.showBack`）、居中标题 |
| `src/renderer/src/shell/shell-layout-store.ts` | 侧栏开合与宽度（默认/最小 250，最大 600；收起不改宽度） |
| `src/renderer/src/shell/navigation-store.ts` | `activeId` / `sidebarSelectedId` / `backStack` / `openFromSidebar` / `open` / `back` |
| `src/renderer/src/shell/create-navigation-store.ts` | 导航 store 工厂（含返回栈；不落盘） |
| `src/renderer/src/shell/keep-alive-outlet.tsx` | 已访问页保活（非当前页 `hidden`；**当前页不加 z-10**，以免压住 Dropdown Portal） |
| `src/renderer/src/shell/session-persistence.ts` | hydrate + 写回 shell/preferences |
| `src/renderer/src/shell/preferences-store.ts` | 主题/语言/general（字体族·字号·关闭行为落盘；语言驱动 `useT`） |
| `src/renderer/src/shell/use-t.ts` | 订阅 `locale`，返回 `t(key)` |
| `src/renderer/src/shell/use-document-lang.ts` | 同步 `html[lang]` |
| `src/renderer/src/shell/theme-resolve.ts` | `ThemePreference` → 实际 light/dark |
| `src/renderer/src/shell/apply-theme.ts` | 写 `html.dark`；可选圆形外扩；`cleanupThemeCircleArtifacts` 清残留遮罩 |
| `src/renderer/src/shell/apply-typography.ts` | 写 `--font-scale` / `--font-sans-family` |
| `src/renderer/src/shell/use-theme-sync.ts` | 订阅偏好与系统配色，无动画同步 |
| `src/renderer/src/components/ui/theme-segment.tsx` | 三档主题 segment（系统/浅/深） |
| `src/renderer/src/shell/sidebar/` | Overview 三项（我的Koven / 定时任务 / 新建项目）/ 搜索 / Projects 树 / 底部设置（首选项导航页 + 关于对话框 + 主题 segment） / 右缘拖宽 |
| `src/renderer/src/routes.ts` | Overview（我的Koven / 定时任务 / 新建项目页）+ 任务占位页 + 首选项页注册表（`AppPage.chrome`） |
| `src/renderer/src/assets/koven.png` | logo |
| `src/renderer/src/capabilities/preferences/` | 首选项导航页（General / System；内部分类经壳快照持久化） |
| `src/renderer/src/capabilities/app-info/` | 关于对话框 |
| `src/renderer/src/capabilities/new-project/` | 新建项目页：居中标题 + Prompt（模式菜单 / 回形针 / 底栏工作空间 Popover 分栏选择 · 权限占位；随内容撑高至 500px） |

CSP：`default-src 'self'`；`style-src` 含 `'unsafe-inline'`（Vite/Radix）；`connect-src` 含 `ws:`/`wss:`（HMR）。收紧 CSP 时先读 `08-pitfalls.md`。

## 2. 别名

渲染代码用 `@renderer/*` → `src/renderer/src/*`，跨进程类型用 `@shared/*`。Vite 与 `tsconfig.web.json` 必须同时有对应 alias/paths。

## 3. UI 层

| 路径 | 内容 |
|---|---|
| `components/ui/button.tsx` | Radix `Slot` + `cva`（含 primary） |
| `components/ui/dialog.tsx` | `@radix-ui/react-dialog` |
| `components/ui/dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu`（Content 须 `z-50`；统一 `koven-menu-in/out` 进出场） |
| `components/ui/tooltip.tsx` | `@radix-ui/react-tooltip`（壳层 `TooltipProvider`；Content `z-50`） |
| `components/ui/separator.tsx` | `@radix-ui/react-separator` |
| `components/ui/theme-segment.tsx` | 主题三档 segment |
| `components/ui/slider.tsx` | 离散档位 range 滑条 |
| `components/ui/switch.tsx` | 二态开关（左关右开） |
| `components/ui/focus-frame.tsx` | 编辑框 0.5px focus 发丝亮边容器（`input`/`textarea` 必包） |
| `components/ui/search-field.tsx` | 搜索框 + 自绘清除钮（替代原生 clear） |
| `components/ui/popover.tsx` | `@radix-ui/react-popover`（Content `z-50`；轻微弹性 `koven-popover-in/out`；可嵌复杂内容） |
| `components/fs-browser/` | 访达式分栏选择：`FileBrowser` + 前往栏 + 开合图标 + `.lnk` 壳图标；可下钻项（目录/卷/此电脑）行尾右箭头；悬停 Tooltip 显示全路径（「此电脑」用 i18n 名）；列数变深时横向滚到最右；路径链祖先伪选中用 `bg-accent`（暗色 `muted===card`，勿用 `bg-muted`）并纵向滚入可视；入参见 `file-browser-types.ts` |
| `lib/cn.ts` | `clsx` + `tailwind-merge` |
| `capabilities/preferences/` | 首选项导航页（General / System） |
| `capabilities/app-info/` | 关于对话框 |
| `capabilities/new-project/` | 新建项目 + Prompt；「选择工作空间」Popover 随 Content 生命周期重挂 `FileBrowser`（勿用 `open` 条件提前拆掉，否则关闭动画只剩底栏）；`value`+`initialPath` 回传对齐 |

新增可复用控件放 `components/ui/`；页面与业务组合放 `capabilities/<name>/`。壳导航与侧栏放 `shell/`。规范见 `09-ui-spec.md`、`10-architecture.md`。

壳级导航用 `navigation-store`；业务 Zustand 仍一包一店。

## 4. 当前页面行为

- 启动先 `hydrateSession`（shell 快照 + preferences），再挂 `AppShell`。
- 默认/恢复：Overview 或上次 `activePageId`；侧栏高亮用 `sidebarSelectedId`（仅常规侧栏入口；对不上则不高亮）。
- Overview / Projects 任务用 `openFromSidebar`；非侧栏进入用 `open`（清高亮）；「首选项」走 `open('preferences')`。「新建项目」为真实页（底部 Prompt 对话框），其余 Overview 项仍占位。
- topbar：始终显示侧栏按钮与当前页 `title`；`AppPage.chrome.showBack` 为真时显示 iOS 风格返回（左箭头 + 上一页 title，拿不到 title 则只显示箭头）；目前仅 `preferences` 开启。返回走 `back()` / `backStack`（内存，不落盘）。
- 侧栏搜索可输入（过滤逻辑稍后）；加号/三点占位；底部「系统设置」菜单含主题 segment、首选项页、关于对话框（检查更新 / 帮助仍占位）。首选项含 General（字体/字号/语言）与 System（关闭时：隐藏到托盘 / 退出主程序）；内部分类 `preferencesSectionId` 随壳会话落盘。
- 壳 UI 与偏好防抖写回 `.data/capabilities/shell/snapshot.json` 与 `preferences/preferences.json`。语言切换立即 `setLocale` + `preferences.set`，界面与托盘菜单立刻换文案（无需重启）。
- 侧栏收起/展开为宽度过渡（拖宽时关过渡）；收起仍记住 `sidebarWidth`。
- 仍不上 react-router。

产品功能不要堆进 `shell/sidebar`；业务进能力包。
