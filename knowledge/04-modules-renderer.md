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
| `src/renderer/src/shell/page-topbar.tsx` | 页面顶栏：侧栏展开/收起（PanelLeft） |
| `src/renderer/src/shell/shell-layout-store.ts` | 侧栏开合与宽度（默认/最小 250，最大 600；收起不改宽度） |
| `src/renderer/src/shell/navigation-store.ts` | `activeId` / `sidebarSelectedId` / `openFromSidebar` / `open` |
| `src/renderer/src/shell/keep-alive-outlet.tsx` | 已访问页保活（隐藏非当前页） |
| `src/renderer/src/shell/session-persistence.ts` | hydrate + 写回 shell/preferences |
| `src/renderer/src/shell/preferences-store.ts` | 主题/语言/general（落盘已接，产品 UI 未接） |
| `src/renderer/src/shell/sidebar/` | Overview / 搜索 / Projects 树 / 底部设置 / 右缘拖宽 |
| `src/renderer/src/routes.ts` | Overview + 任务占位页注册表 |
| `src/renderer/src/assets/koven.png` | logo |

CSP：`default-src 'self'`；`style-src` 含 `'unsafe-inline'`（Vite/Radix）；`connect-src` 含 `ws:`/`wss:`（HMR）。收紧 CSP 时先读 `08-pitfalls.md`。

## 2. 别名

渲染代码用 `@renderer/*` → `src/renderer/src/*`，跨进程类型用 `@shared/*`。Vite 与 `tsconfig.web.json` 必须同时有对应 alias/paths。

## 3. UI 层

| 路径 | 内容 |
|---|---|
| `components/ui/button.tsx` | Radix `Slot` + `cva` |
| `components/ui/dialog.tsx` | `@radix-ui/react-dialog` |
| `components/ui/dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` |
| `components/ui/separator.tsx` | `@radix-ui/react-separator` |
| `lib/cn.ts` | `clsx` + `tailwind-merge` |
| `capabilities/app-info/` | 旧演示关于菜单（未挂侧栏） |
| `capabilities/shelf/` | 旧演示计数页（未挂路由，可删） |

新增可复用控件放 `components/ui/`；页面与业务组合放 `capabilities/<name>/`。壳导航与侧栏放 `shell/`。规范见 `09-ui-spec.md`、`10-architecture.md`。

壳级导航用 `navigation-store`；业务 Zustand 仍一包一店。

## 4. 当前页面行为

- 启动先 `hydrateSession`（shell 快照 + preferences），再挂 `AppShell`。
- 默认/恢复：Overview 或上次 `activePageId`；侧栏高亮用 `sidebarSelectedId`（仅常规侧栏入口；对不上则不高亮）。
- Overview / Projects 任务用 `openFromSidebar`；非侧栏进入用 `open`（清高亮）。
- 侧栏搜索只读；加号/三点/底部菜单占位。
- 壳 UI 与偏好防抖写回 `.data/capabilities/shell/snapshot.json` 与 `preferences/preferences.json`。
- 侧栏收起/展开为宽度过渡（拖宽时关过渡）；收起仍记住 `sidebarWidth`。
- 仍不上 react-router。

产品功能不要堆进 `shell/sidebar`；业务进能力包。
