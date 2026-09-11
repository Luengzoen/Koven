# Koven 知识图谱分片：07 工程与构建

> 路由：`knowledge/07-patterns-build.md`（路由表 knowledge-graph.md 的 07 号分片）
> 覆盖内容：electron-vite、electron-builder、tsconfig paths、Tailwind v4、confine、scripts 清单、测试与 lint
> 何时读：改构建、Tailwind、TS 配置、缓存隔离、加脚本、排障工程问题

## 1. npm 脚本

| 命令 | 作用 |
|---|---|
| `npm start` / `npm run dev` | `scripts/confine.js dev` → `electron-vite dev`（须用户授权） |
| `npm run preview` | 预览生产构建（需先有 `out/`；须用户授权） |
| `npm run build` | `scripts/confine.js build` → `electron-vite build`（出 `out/`） |
| `npm run build:unpack` | `electron-vite build` + `electron-builder --dir`（绿色目录 `dist/win-unpacked`） |
| `npm run build:win` | `scripts/build-win.mjs`：可选升版本 → **`npm run check`** → confine build → confine pack（NSIS） |
| `npm run publish` | `scripts/publish-release.mjs`：从 `dist/` **mtime 最新** 的 `koven-*-setup.exe` 建公开 GitHub Release（不打包） |
| `npm run typecheck` | 两套 `tsc --noEmit` + `check-file-budget.mjs` + `check-capability-sync.mjs` |
| `npm run lint` | ESLint（`eslint.config.mjs`） |
| `npm test` / `npm run test:watch` | Vitest（`vitest.config.ts`，`src/**/*.test.ts`） |
| `npm run check` | `typecheck` + `lint` + `test`（提交前 / 打包前必过） |
| `npm run new:capability` | `scripts/new-capability.mjs <kebab-name>`：生成四端骨架，**并自动改** `app-api.ts` / `register-ipc.ts` / `preload/index.ts` |
| `npm run sync` | `scripts/sync.mjs`：把本机 Agent 图谱/规则强制提交并推到 `vibe`（无则从 master 创建）；结束后切回原分支（**须用户授权 Git**） |
| `postinstall` | `confine.js install`：Electron 二进制进 `node_modules/electron/dist`，zip 缓存在 `.electron-cache` |

`package.json` 的 `main` 是 `./out/main/index.js`。`os: ["win32"]`。

**不要**直接 `npx electron .` 或 `npx electron-builder`：会绕过 confine 的环境变量。

### Agent 如何测

1. 改纯逻辑 / 存储 / 迁移 → `npm test`
2. 改能力包或 IPC 骨架 → `npm run typecheck`（含三端契约）
3. 改文风/进程边界 → `npm run lint`
4. 提交或打包前 → `npm run check`
5. 样式/纯客户端 Zustand → 可用浏览器看 `localhost:5173`；**IPC / 落盘 / 托盘 / 原生主题必须以 Electron 真窗口为准**（先征得用户同意再 `npm start`）

## 1.5 scripts/ 目录清单

| 文件 | 作用 | 谁调用 | Agent 可否直接跑 |
|---|---|---|---|
| `confine.js` | 工具链落盘隔离后 spawn install/dev/preview/build/pack/unpack | npm 各入口 / `build-win.mjs` | 优先经 npm；勿旁路 |
| `build-win.mjs` | 升版本 + check + 打包 NSIS | `npm run build:win` | 可（大下载仍交用户） |
| `publish-release.mjs` | mtime 选最新 setup.exe → GitHub Releases（公开 latest） | `npm run publish` | 可（须 `GH_TOKEN`；不启 Electron） |
| `check-file-budget.mjs` | 源码行数硬门槛 500 | `npm run typecheck` | 可 |
| `check-capability-sync.mjs` | IPC 能力包三端 + `app-api` / 注册表齐套 | `npm run typecheck` | 可 |
| `new-capability.mjs` | 生成能力包四端骨架 + 自动三端注册表 | `npm run new:capability` | 可 |
| `sync.mjs` | vibe 分支强制同步图谱/规则 | `npm run sync` | **须用户授权 Git** |

根目录配置（非 scripts，但属工程门禁）：`vitest.config.ts`、`eslint.config.mjs`。

### 新增脚本规约

1. 落点必须在 `scripts/`（本地 `.mjs` / `.js` 优先，能脚本解决就不加依赖）。
2. 凡会触发 Electron / builder / npm 缓存的，必须经 `confine.js`，禁止旁路。
3. 计入文件预算（硬 500）；改/增脚本必须同步更新**本表**与 §1 npm 表。
4. 质量门类脚本并进 `npm run typecheck` 或 `npm run check`。
5. 需要 Git 或启动应用的脚本，遵守 AGENTS 授权铁律。

## 2. electron-vite

`electron.vite.config.ts`：

- main：`externalizeDepsPlugin()`，alias `@shared`
- preload：**不** externalize 第三方（当前也没有）；alias `@shared`；输出 CJS
- renderer：`@vitejs/plugin-react` + `@tailwindcss/vite`；alias `@renderer`、`@shared`

默认产物目录 `out/`。开发时渲染进程 dev server 在 `http://localhost:5173/`（**无 preload，没有 `window.koven`**）。

## 2.5 electron-builder（仅 Windows）

配置：`electron-builder.yml` + `build/installer.nsh` + `scripts/build-win.mjs`。打包流程对齐参考项目的发版方式，**不含**自动更新源 / changelog 业务。发版托管用独立脚本 `npm run publish`（GitHub Releases），**不要**在 yml 里写 `publish:`，以免本地 `build:win` 误上传。

- `productName` 与 `win.executableName` 都是 `Koven`（安装目录 / 快捷方式 / 任务栏 / 卸载列表一致）。
- `author` 必须是对象 `{ "name": "Koven" }`，否则 exe 属性里公司名为空；`copyright` 写在 yml。
- **不要**写 `installDirectory`（不在 schema）；**不要**加 mac/linux 段。
- 目标：NSIS x64；本地 Electron：`electronDist` + `electronDownload.mirror` 国内镜像兜底。
- 产物：`dist/koven-<version>-setup.exe`（`artifactName` 用 `${name}`）。
- 不签名：`CSC_IDENTITY_AUTO_DISCOVERY=false`。
- NSIS：`perMachine: true` + 可改目录；`include: build/installer.nsh`（**UTF-8 BOM**）。
  - `customInit`：已装则沿用 HKLM `InstallLocation`；全新安装默认 `D:\Program Files\Koven`，无 D 盘用 `$PROGRAMFILES64`。检测 D 盘必须 `"D:\*.*"`，`"D:\"` 恒假。
  - `customInstall`：`icacls` 给 Users 修改权限，否则 `D:\Program Files` 可能套了系统 ACL，`.data` 写不进去。
  - 交互卸载：询问是否备份 `.data` 到「我的文档\Koven-数据备份」。
  - 静默卸载（覆盖升级）：`.data` 先移出再删目录后移回。
- `package.json` 的 `description` **不**进入 exe 文件说明；文件说明 = `productName`。

### build:win 参数

```bash
npm run build:win                         # 原地打包
npm run build:win -- --i patch            # 1.0.0 → 1.0.1
npm run build:win -- --i minor            # 1.0.0 → 1.1.0
npm run build:win -- --i major            # 1.0.0 → 2.0.0
npm run build:win -- --version 1.5.0      # 必须大于当前版本，可简写 --v
npm run build:win -- --dry-run            # 只预览版本，不写文件不打包
```

版本写回：正则只替换 `"version": "旧版本"`（package.json 最多 1 处、lock 最多 2 处根版本）。内部链路：`npm run check` → `node scripts/confine.js build` → `node scripts/confine.js pack`。Windows 下 spawn **npm** 必须 `shell: true`；confine 本身用 `process.execPath` 跑 js（**不要**再开 shell，否则 `Program Files` 空格会被 cmd 拆开），避免 `.cmd` ENOENT。

进度：electron-builder 的 `•` 行切中文阶段；`signing` 行滞后，耗时是行间窗口不是单文件耗时，以 `dist/` 产物 mtime 为准。阶段名按 key **长度降序**匹配（`building block map` 必须先于 `building`）。

### publish（GitHub Releases）

```bash
# 一次性：复制 .env.example → .env，填入 classic PAT（repo）或 fine-grained（Contents + Releases 写）
# .env 已 gitignore，勿提交
npm run build:win -- --i patch     # 先本地打包
npm run publish                    # 上传 mtime 最新安装包
npm run publish -- --dry-run       # 只预览选中文件与 tag
```

- **不**重新打包；无 `dist/` 或无匹配 `koven-<x.y.z>-setup.exe` 则失败。
- 选包规则：按 **mtime 最新**，不是 `package.json` 版本；tag / Release 名从文件名解析（`v1.0.1`）。
- `draft: false` + `make_latest: true`；同主名 `.blockmap` 存在则一并上传。
- tag/Release 已存在 → 失败（不覆盖）。owner/repo 从 `git remote origin` 解析。
- 鉴权：优先已有环境变量，否则读项目根 **`.env`** 的 `GH_TOKEN` / `GITHUB_TOKEN`（脚本自解析，无 dotenv 依赖）。`.env` 必须 gitignore；可用 `.env.example` 作模板。
- 进度：与 `build:win` 同风格（阶段号 + 转圈/进度条 + 耗时 + `✓`）。上传阶段用**本地已发送字节**画行内进度条（GitHub 上传 API **无**进度回调）；非上传阶段仍用转圈。

首次打包会拉 NSIS 等工具（可能超过 50MB）。按铁律 8，Agent 不代下；缓存目录 `.electron-builder-cache`。

## 3. TypeScript

- `tsconfig.json` 只有 project references。
- **禁止 `baseUrl`**（TS 6 弃用，TS 7 删除）。`paths` 写相对本 tsconfig 的路径，例如 `"@shared/*": ["./src/shared/*"]`。
- node 配置 include：`electron.vite.config.*`、`src/main`、`src/preload`、`src/shared`。
- web 配置 include：renderer、`src/preload/*.d.ts`、`src/shared`；`jsx: react-jsx`。

## 4. Tailwind CSS v4

- 插件在 **Vite renderer**，不是 PostCSS：`@tailwindcss/vite`。
- CSS 顶部：`@import "tailwindcss";`，主题用 `@theme`。
- **无需** `tailwind.config.js`，也无需 `@tailwind base/components/utilities`。
- IDE 若报 unknown at-rule：`.vscode/settings.json` 里 `"css.lint.unknownAtRules": "ignore"`。

## 5. 落盘隔离（confine + npmrc）

`.npmrc`：`cache=.npm-cache`、`electron_config_cache=.electron-cache`、`electron_mirror=https://npmmirror.com/mirrors/electron/`。

`scripts/confine.js` 是**工具链落盘隔离入口**（不是业务逻辑）：在 spawn 子进程前设置

- `ELECTRON_CACHE` / `electron_config_cache`
- `ELECTRON_BUILDER_CACHE` / `ELECTRON_BUILDER_BINARIES_MIRROR`
- `CSC_IDENTITY_AUTO_DISCOVERY=false`
- `npm_config_cache`
- `APPDATA` / `LOCALAPPDATA` / `TEMP` / `TMP` / `TMPDIR`
- `ELECTRON_MIRROR`

主进程 `env.ts` + `apply-isolated-paths` 管**运行时**应用数据。可写时钉到 `.data/`；不可写时 Electron 与能力 JSON 全量回落 `%APPDATA%\koven`。`confine.js` 在 Windows 上会 `chcp 65001`，避免主进程中文日志乱码。

## 6. 版本控制忽略

`.gitignore`：`node_modules/`、`out/`、`dist/`、`.data/`、`.npm-cache/`、`.electron-cache/`、`.electron-builder-cache/`、`*.tsbuildinfo`、**`.env`** / `.env.local` / `.env.*.local`。

**保留 `package-lock.json`。** 发版令牌只放本地 `.env`（见 `.env.example`），禁止提交。