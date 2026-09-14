# Koven 知识图谱分片：02 主进程

> 路由：`knowledge/02-modules-main.md`（路由表 knowledge-graph.md 的 02 号分片）
> 覆盖内容：Windows 校验、路径隔离、BrowserWindow、IPC handle
> 何时读：改窗口、落盘路径、主进程生命周期、新 IPC 实现

## 1. 入口顺序

`src/main/index.ts` 的**第一条 import 必须是** `import './env'`，然后只调 `startApp()`。

原因：ESM/打包后的模块求值按 import 图深度优先。`env.ts` **不能** `import 'electron'`，这样会先改 `process.env.APPDATA` / `TEMP` 等，再加载 Electron。随后 `kernel/apply-isolated-paths.ts` 再 `app.setPath(...)`。详见 `08-pitfalls.md`。

## 2. `env.ts`

- 非 `win32`：`console.error` 后 `process.exit(1)`。
- 开发：`projectRoot = join(__dirname, '../..')`（`out/main` 上两级为仓库根）。
- 安装包内：`__dirname` 含 `app.asar` 时，`projectRoot = dirname(process.execPath)`（安装目录），优先把 `.data` 写在 exe 旁边。
- 打包态先做可写探测（写 `.write-probe` 再删）。
  - **可写**：`getDataRoot()` = `<install|project>/.data`；`apply-isolated-paths` 调 `app.setPath`；覆盖 `APPDATA` 等环境变量。
  - **不可写（产品策略）**：**不拒绝启动**。Electron 保持系统默认路径；`getDataRoot()` 改为 `%APPDATA%\koven`（与默认 `userData` 同根），能力 JSON / 应用日志一并落那里；打包态弹窗告知「将保存到系统默认位置」。installer.nsh 会 `icacls` 尽量避免此分支。
- 可写时在 `.data/` 下创建：`appData` / `localAppData` / `userData` / `sessionData` / `temp` / `logs` / `crashDumps` / `disk-cache`。

## 3. 内核

| 文件 | 作用 |
|---|---|
| `kernel/start-app.ts` | `whenReady`、AppUserModelId、快捷键、退出口、启动日志 |
| `kernel/apply-isolated-paths.ts` | `app.setPath` / 不可写弹窗与全量回落 / disk-cache 开关 |
| `kernel/create-main-window.ts` | 窗口工厂（WCO 自定义标题栏 + 可传尺寸 options） |
| `kernel/register-ipc.ts` | 只调用各包 `registerXxx()` |
| `kernel/storage.ts` | `readJson` / `writeJson`（原子写）→ `getDataRoot()/capabilities/<name>/` |
| `kernel/atomic-file-write.ts` | Windows 安全替换：`*.tmp` → 备份旧文件 → rename |
| `kernel/migrate-json.ts` | 通用 JSON `version` 迁移（`steps[i]: i → i+1`） |
| `kernel/app-log.ts` | 主进程结构化日志追加到 `getLogsRoot()/main.log` |
| `capabilities/shell/snapshot.ts` | 壳快照 JSON（窗口/导航/侧栏）；load 时 migrate + normalize |
| `capabilities/shell/window-state.ts` | 窗口 move/resize/close 写回 |
| `capabilities/preferences/` | 偏好 JSON；load 时 migrate + normalize；写 theme 时同步 `nativeTheme` |
| `kernel/app-icon.ts` | 解析图标：dev 为 `out/main` 上两级的 `build/koven.ico`；打包托盘为 `resources/koven.ico` |
| `kernel/tray.ts` | 系统托盘、关闭隐藏到托盘、退出守卫；菜单文案走 `t(locale)`；`refreshTrayMenu` 供语言切换 |
| `kernel/title-bar-overlay.ts` | WCO 标题栏颜色；可显式传 dark，或读 `shouldUseDarkColors` |

窗口默认与最小均为 1024×700；无快照或落盘几何无效时相对主屏工作区居中。`titleBarStyle: 'hidden'` + `titleBarOverlay`（高 30px，右上角保留 Windows 原生最小化/最大化/关闭）；`preload: join(__dirname, '../preload/index.js')`；`contextIsolation: true`；`nodeIntegration: false`；`sandbox: true`；开发态 `icon: build/koven.ico`；外链 `openExternal` + `deny`；开发 `loadURL`，否则 `loadFile`。

**关闭与托盘**：点窗口关闭钮 → 读 `preferences.general.closeBehavior`（默认 `tray`：`preventDefault` + `hide()`；`quit`：放行关闭并退出）。托盘单击 → 恢复主窗口。托盘菜单「退出 Koven」→ `app.quit()`；「显示主窗口」「设置」暂为占位（disabled）；菜单文案随 `locale` 切换（`preferences:set` 改语言时 `refreshTrayMenu`）。`before-quit` / `query-session-end` 置 `quitting`，此后 close 不再拦截。

图标：`build/koven.ico`（electron-builder `win.icon` + dev 窗口/托盘）；打包后托盘读 `extraResources` 复制的 `resources/koven.ico`。渲染进程标题栏 logo 用 `src/renderer/src/assets/koven.png`。

## 4. 已有 IPC

新 handle **不要**写进 `index.ts` / `start-app.ts`。在 `src/main/capabilities/<name>/` 写 use-case 与 `register.ts`，再于 `register-ipc.ts` 加一行。合约见 `src/shared/capabilities/<name>.ts`（`10-architecture.md`）。

| 通道 | 常量 | 行为 |
|---|---|---|
| `app-info:get` | `appInfoIpc.get` | 返回 `Result<AppInfo>`（name / version，供关于对话框） |
| `shell:is-maximized` | `shellIpc.isMaximized` | 当前窗是否最大化 |
| `shell:maximized-changed` | `shellIpc.maximizedChanged` | main → renderer 推送（非 handle） |
| `shell:get-snapshot` | `shellIpc.getSnapshot` | 读壳快照 JSON |
| `shell:patch-ui` | `shellIpc.patchUi` | 合并写导航/侧栏（不改 window，window 由 main 窗口事件写） |
| `preferences:get` | `preferencesIpc.get` | 读偏好 JSON |
| `preferences:set` | `preferencesIpc.set` | 合并写 theme/locale/general（只落盘，不改 WCO）；locale 变更时重建托盘菜单 |
| `preferences:apply-theme` | `preferencesIpc.applyTheme` | 渲染 → main（`send`）：立刻改 themeSource + WCO；主题扩散圆碰到右上角时再调 |
| `fs-browser:list-roots` | `fsBrowserIpc.listRoots` | 根列：当前用户目录（用户名）/文档/图片/下载/桌面/此电脑（`app.getPath` Known Folder） |
| `fs-browser:list-volumes` | `fsBrowserIpc.listVolumes` | 枚举本机可读逻辑卷（「此电脑」子列） |
| `fs-browser:list-directory` | `fsBrowserIpc.listDirectory` | 单层目录列举 + 短 TTL 缓存；`::this-pc` 返回卷列表 |
| `fs-browser:get-entry-detail` | `fsBrowserIpc.getEntryDetail` | 聚焦项详情（大小/时间/卷容量等） |
| `fs-browser:resolve-path` | `fsBrowserIpc.resolvePath` | 解析绝对路径为可展开列链 |
| `fs-browser:get-file-icon` | `fsBrowserIpc.getFileIcon` | 文件图标 PNG data URL；`.lnk` 先 `readShortcutLink` 再对 icon/target 取图标（避免通用快捷方式白纸图标） |
| `projects:list-projects` | `projectsIpc.listProjects` | 未归档项目全量（`sort_order` 固定） |
| `projects:list-tasks` | `projectsIpc.listTasks` | 某项目任务分页（默认 10，`last_chat_at` 降序 + `hasMore`） |
| `projects:create-project-with-task` | `projectsIpc.createProjectWithTask` | 工作空间建项目（名=文件夹名）+ 首任务；**同路径未归档项目去重**，只加任务 |
| `projects:create-task` | `projectsIpc.createTask` | 已有项目下建任务 |
| `projects:rename-task` / `archive-task` / `delete-task` | 对应常量 | 重命名 / 软归档 / 硬删除；若项目下已无未归档任务则一并硬删项目（返回 `removedProjectId`） |
| `projects:update-task-status` | `projectsIpc.updateTaskStatus` | `loading` \| `finished` \| `error` \| `idle` |
| `projects:touch-task-chat` | `projectsIpc.touchTaskChat` | 更新 `last_chat_at`（置顶） |
| `projects:search` | `projectsIpc.search` | 项目名/任务标题搜索分页 + `hasMore` |
| `projects:get-task` | `projectsIpc.getTask` | 按 id 取任务 |

### projects（SQLite）

- 库文件：`getDataRoot()/capabilities/projects/koven.db`
- 引擎：**`node:sqlite`（`DatabaseSync`）**，零 npm 依赖；与小红书Agent 同路径。绑定参数禁止 `undefined`（须 `?? null`）
- 打开时 `repairProjectIntegrity`：合并同路径未归档项目、删除无未归档任务的空项目、`lower(workspace_path)` 唯一索引
- 实现：`src/main/capabilities/projects/`（`db.ts` / `queries.ts` / `mutations.ts` / `repair.ts` / `workspace-path.ts` / `row-utils.ts` / `register.ts`）
- 消息正文本阶段不落库（renderer mock 流式）

### fs-browser 与 MFT

分栏（Miller columns）每次只需要**当前列的一层子项**。整盘扫 `$MFT` 对这种 UI 收益小，且读 `\\.\C:` / 解析 MFT 通常要管理员或备份特权，不适合默认桌面进程。

当前策略（性能优先且免提权）：

1. `readdir({ withFileTypes: true })` 列一层（Windows 上走大缓冲目录查询路径）
2. 目录 mtime + LRU/TTL 缓存命中则不重读
3. 详情按聚焦懒加载（`stat` / `statfs`），列表不批量 `stat`
4. **不做**默认整盘 MFT 索引；若以后要「全局秒搜」，再评估提权助手 / USN Journal / 可选 Everything SDK，另开能力包
5. 隐藏项：`dir` 点前缀 + PowerShell 读 Windows `Hidden` 属性；默认列举时可见并降不透明度
6. `.lnk`：展示名去掉后缀；图标经 `get-file-icon`（`readShortcutLink` → icon/target，禁止对 lnk 路径直接 `getFileIcon`）

主进程实现目录：`src/main/capabilities/fs-browser/`（`list-roots` / `list-directory` / `list-volumes` / `get-entry-detail` / `resolve-path` / `get-file-icon` / `windows-hidden` / `directory-cache`）。

UI 容器在渲染进程 `components/fs-browser/FileBrowser`，可嵌页面 / Dialog / Popover。关键入参含 `title` / `mode` / `maxCount` / `accept` / `value`+`initialPath`（回传选中并对齐分栏）等，见 `file-browser-types.ts`。
