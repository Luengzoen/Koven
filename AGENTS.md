# AGENTS.md — Koven 项目规范

> 项目：Koven（Windows-only Electron 桌面应用）

---

## ⚠️ 铁律（最高优先级，严禁违反）

1. **严禁落盘项目外** — 任何文件、依赖、缓存、临时文件都**只能**存在于本项目目录内。绝不允许在系统目录、用户目录、全局路径写入任何东西。运行时数据进 `.data/`，npm 缓存进 `.npm-cache/`，Electron 二进制缓存进 `.electron-cache/`，electron-builder 工具缓存进 `.electron-builder-cache/`，安装包进 `dist/`。启动、安装与打包必须走 `scripts/confine.js`（`npm start` / `npm run dev` / `npm run build` / `npm run build:win` / `postinstall`），禁止直接跑会把缓存写到 `%APPDATA%` / `%LOCALAPPDATA%` 的命令。

2. **Node 依赖仅装项目内** — 依赖必须安装在项目 `node_modules`。安装时带项目内 cache（`.npmrc` 已配 `cache=.npm-cache`）。严禁 `npm install -g`（**唯一例外：包管理器本体允许全局安装**）。

3. **本地脚本优先** — 如果 npm 包提供的功能并不比写一段本地脚本强多少（简单文件处理、格式转换、字符串操作等），**优先写本地脚本**，不引入额外依赖。

4. **Git 操作需授权** — 任何 git 操作（`add`/`commit`/`push`/`pull`/`merge`/`rebase`）**必须先征得用户明确同意**，禁止私自执行。

5. **开发应用需授权** — 启动、停止、重启 Electron / `npm start` / `npm run dev` / `npm run preview` **必须先征得用户明确同意**。

6. **越界落盘需告知** — 非 Agent 或用户可控情况下文件落到项目外，必须告知用户。

7. **严禁使用 Docker** — 开发与运行一律本机直跑。项目环境 = 本机 Windows + 项目内依赖。

8. **大文件下载交用户** — 单个体积**超过 50MB** 的下载一律交给用户自行下载。Agent 只给准确链接、版本号与落盘路径。Electron 运行时 zip 已由 `postinstall` + 项目内 `.electron-cache` 管理；不要再下到用户目录。

9. **决策先查图谱（路由制）** — 不好决策、不好判断或前置条件不足时，必须先读项目根目录 `knowledge-graph.md`（**路由表**）定位领域，再**按需阅读 `knowledge/` 对应分片**后再继续——**禁止全量阅读全部分片，也禁止只读路由表不读分片**。禁止凭猜测推进。

10. **文件膨胀双门槛** — 代码文件**超过 300 行**且还会继续涨：先提出拆分方案，由用户决定。**超过 500 行**禁止合入：`npm run typecheck` 会跑 `scripts/check-file-budget.mjs` 并失败。例外（生成物、纯常量清单、一次性迁移脚本）必须写入该脚本 `allowlist`，不能口头豁免。增量单位是能力包，不是往入口文件加 case；细则见 `knowledge/10-architecture.md`。

11. **仅 Windows** — `process.platform !== 'win32'` 必须退出。禁止引入 macOS / Linux 路径、打包目标或条件编译，除非用户明确要求。

12. **渲染进程无 Node** — `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。渲染进程禁止 `require`/`fs`/`path`。主进程能力只通过 preload 的 `contextBridge` 以**窄 API**（`window.koven`）暴露。禁止把整个 `ipcRenderer` 丢给渲染进程。

13. **类型严格** — TypeScript `strict`，禁止 `any` 逃逸（可临时 `// @ts-expect-error` 并注明原因）。路径别名**不要**写已弃用的 `baseUrl`。

14. **UI 状态用 Zustand** — 桌面 UI 状态默认 Zustand + selector 订阅。禁止默认上 Redux Toolkit；若用户明确要求再评估。需要持久化的数据走主进程 IPC 写到 `.data/`，不要依赖系统 AppData。

15. **界面禁止泄露实现（给使用者看的文案）** — 产品界面只说「能做什么 / 出了什么状况」。禁止把技术栈名、IPC 通道、目录名、图谱路径、实现词写进给使用者看的文案。代码注释和 `knowledge/` 可以写实现。当前脚手架首页仍是开发演示面，产品化文案时必须改掉。细则见 `knowledge/09-ui-spec.md`。

16. **内置浏览器工具映射 + 禁止截图** — 用户说在内置浏览器里看/点/测页面时，用 Cursor 的 `cursor-ide-browser`（`browser_snapshot` / accessibility 树 + `browser_cdp` 的 `Runtime.evaluate`）。**禁止** `browser_take_screenshot` 与 CDP `Page.captureScreenshot`。Electron 真窗口与 `http://localhost:5173` 不是同一运行时：后者没有 `window.koven`，只能验样式与客户端状态，不能当 IPC 验证。

---

## ⚙️ 工程规范

17. **三进程边界** — `src/main` 用 Node；`src/preload` 只允许 `electron` 的 `contextBridge`/`ipcRenderer`；`src/renderer` 只允许 Web API + 通过 `window.koven` 调主进程。跨端类型放 `src/shared`。

18. **新增 IPC** — 通道名与类型写在 `src/shared/capabilities/<name>.ts`，`src/shared/app-api.ts` 只做 `AppAPI` 交集。preload 在 `capabilities/<name>/api.ts` 暴露，main 在 `capabilities/<name>/register.ts` 用 `ipcMain.handle` 实现，并在三端注册表各加一行。三处必须一起改。返回 `Result<T, AppError>`。

19. **启动与打包入口** — 开发用 `npm start`。Windows 安装包用 `npm run build:win`（可选 `--i patch|minor|major` / `--version x.y.z` / `--dry-run`）。绿色目录用 `npm run build:unpack`。不要直接 `electron .` 或 `electron-builder`，会绕过落盘隔离。
