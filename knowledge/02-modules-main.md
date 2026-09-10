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
- 安装包内：`__dirname` 含 `app.asar` 时，`projectRoot = dirname(process.execPath)`（安装目录），`.data` 写在 exe 旁边。
- 打包态先做可写探测（写 `.write-probe` 再删）。不可写则**不**改 `setPath`，弹窗建议装到 `D:\Program Files\Koven`（installer.nsh 会 `icacls` 放开 Users 写权限；无 D 盘回退系统 Program Files）。
- 可写时在 `.data/` 下创建：`appData` / `localAppData` / `userData` / `sessionData` / `temp` / `logs` / `crashDumps` / `disk-cache`。
- 覆盖 `APPDATA`、`LOCALAPPDATA`、`TMP`、`TEMP`、`TMPDIR`。

## 3. 内核

| 文件 | 作用 |
|---|---|
| `kernel/start-app.ts` | `whenReady`、AppUserModelId、快捷键、退出口 |
| `kernel/apply-isolated-paths.ts` | `app.setPath` / 不可写弹窗 / disk-cache 开关 |
| `kernel/create-main-window.ts` | 窗口工厂（WCO 自定义标题栏 + 可传尺寸 options） |
| `kernel/register-ipc.ts` | 只调用各包 `registerXxx()` |
| `kernel/storage.ts` | `readJson` / `writeJson` → `.data/capabilities/<name>/` |
| `capabilities/shell/snapshot.ts` | 壳快照 JSON（窗口/导航/侧栏） |
| `capabilities/shell/window-state.ts` | 窗口 move/resize/close 写回 |
| `capabilities/preferences/` | 偏好 JSON（主题/语言/general）；写 theme 时同步 `nativeTheme.themeSource` |
| `kernel/app-icon.ts` | 解析图标：dev 为 `out/main` 上两级的 `build/koven.ico`；打包托盘为 `resources/koven.ico` |
| `kernel/tray.ts` | 系统托盘、关闭隐藏到托盘、退出守卫放行标志 |
| `kernel/title-bar-overlay.ts` | WCO 标题栏颜色；可显式传 dark，或读 `shouldUseDarkColors` |

窗口默认与最小均为 1024×700；无快照或落盘几何无效时相对主屏工作区居中。`titleBarStyle: 'hidden'` + `titleBarOverlay`（高 30px，右上角保留 Windows 原生最小化/最大化/关闭）；`preload: join(__dirname, '../preload/index.js')`；`contextIsolation: true`；`nodeIntegration: false`；`sandbox: true`；开发态 `icon: build/koven.ico`；外链 `openExternal` + `deny`；开发 `loadURL`，否则 `loadFile`。

**关闭与托盘**：点窗口关闭钮 → 读 `preferences.general.closeBehavior`（默认 `tray`：`preventDefault` + `hide()`；`quit`：放行关闭并退出）。托盘单击 → 恢复主窗口。托盘菜单「退出 Koven」→ `app.quit()`；「显示主窗口」「设置」暂为占位（disabled）。`before-quit` / `query-session-end` 置 `quitting`，此后 close 不再拦截。

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
| `preferences:set` | `preferencesIpc.set` | 合并写 theme/locale/general（只落盘，不改 WCO） |
| `preferences:apply-theme` | `preferencesIpc.applyTheme` | 渲染 → main（`send`）：立刻改 themeSource + WCO；主题扩散圆碰到右上角时再调 |
