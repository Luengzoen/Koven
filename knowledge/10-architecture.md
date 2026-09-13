# Koven 知识图谱分片：10 增量架构（能力核 + 能力包）

> 路由：`knowledge/10-architecture.md`（路由表 knowledge-graph.md 的 10 号分片）
> 覆盖内容：增量单位、目录形状、三端注册表、文件预算、八种加法
> 何时读：新建功能、拆文件、加 IPC、加页面、担心文件膨胀

## 1. 增量单位

新功能不是往 `index.ts` / `App.tsx` / `app-api.ts` 里加 case，而是加一个**能力包**。

| 层 | 改什么 |
|---|---|
| 能力核 | 只因桌面壳本身变化：窗口工厂、路径隔离、IPC 总线、`.data` 存储端口、`Result`、壳布局 |
| 能力包 | 一次产品增量。新目录 + 每个进程注册表最多各加 1 行 |
| 合约 | 包自己的通道名与 DTO，放 `src/shared/capabilities/<name>.ts` |

Electron 沙箱 + TypeScript 用**静态 import**。禁止插件热加载、目录扫描、巨型 barrel。

口诀仍是：**系统能力进 main，白名单进 preload，界面进 renderer。**

## 2. 目录形状（按进程切开）

```
src/main/kernel/                 # 生命周期、窗口、IPC 总注册、存储端口
src/main/capabilities/<name>/    # register.ts + 各 use-case
src/preload/kernel/              # expose 一次
src/preload/capabilities/<name>/api.ts
src/shared/kernel/result.ts      # Result / AppError
src/shared/capabilities/<name>.ts
src/shared/app-api.ts            # 只做 AppAPI = A & B & ...
src/renderer/src/app/App.tsx     # 只挂壳
src/renderer/src/shell/
src/renderer/src/routes.ts
src/renderer/src/capabilities/<name>/
src/renderer/src/components/ui/  # 无业务的 Radix 包装
```

物理分家，禁止 main 去 import 渲染代码。

新建：

```bash
npm run new:capability -- <kebab-name>
```

生成四端骨架，并**自动**在三端注册表各加一行（`app-api.ts` / `register-ipc.ts` / `preload/index.ts`；幂等，已存在则跳过）。开发者填 use-case；有页面时再改 `routes.ts`。只做界面、不要 IPC：**不要**跑本命令，只在 renderer 加页面并注册路由，勿建空 main/preload/shared。

## 3. 三端注册表

| 端 | 文件 | 加一行 |
|---|---|---|
| 合约组装 | `src/shared/app-api.ts` | `AppAPI = ... & FooAPI`（`new:capability` 自动） |
| 主进程 | `src/main/kernel/register-ipc.ts` | `registerFoo()`（自动） |
| preload | `src/preload/index.ts` | `...fooApi`（自动） |
| 页面 | `src/renderer/src/routes.ts` | 有页面才注册（仍手改） |


IPC 仍须三处同步（合约 → preload → main handle），但落在包内，不改 `src/main/index.ts` 正文。

`src/main/index.ts` 只做 `import './env'` 再 `startApp()`。

通道名：`<capability>:<action>`。页面调用：`window.koven.<capability>.<action>()`。IPC 返回 `Result<T, AppError>`。

持久化走 `src/main/kernel/storage.ts` 的 `readJson` / `writeJson`（**必须**经内核原子写），落点 `getDataRoot()/capabilities/<name>/`（可写时为 `.data/…`，不可写时为 `%APPDATA%\koven/…`）。当前约定：

- **B 壳会话** → `shell/snapshot.json`（load：migrate → normalize → 必要时写回）
- **A 偏好** → `preferences/preferences.json`（同上）

禁止 `localStorage` 当业务库。埋点与多行业务以后另仓（可 SQLite），见 `06-patterns-state.md`。

IPC 三端齐套由 `scripts/check-capability-sync.mjs` 门禁（并进 `npm run typecheck`）：漏注册表 / 缺 preload api / 缺 shared 合约会失败。只做 UI、无 IPC 的包不要建空的 main/preload 骨架去注册。

壳布局（侧栏、topbar、keepalive）放 `src/renderer/src/shell/`，不算业务能力包；业务页仍进 `capabilities/<name>/` 或经 `routes.ts` 注册的占位页。

第二扇窗口只扩 `createMainWindow(options)`，禁止复制窗口创建函数。

## 4. 八种加法

- **新页面**：只加 renderer 能力包，`routes.ts` 加一行。
- **新系统能力**：合约 + main register + preload api；页面再调 `window.koven.<name>.*`。
- **新可复用控件**：只进 `components/ui/<control>.tsx`。
- **要持久化**：内核存储端口 + 能力包 use-case。
- **第二扇窗口**：内核窗口工厂加 options。
- **跨功能流程**：新建第三个编排包，禁止把两个包合成一个大文件。
- **横切（日志、错误、路径）**：只加内核端口一次。
- **功能废弃**：删四端目录，注册表各删一行。

先不上 react-router；`routes.ts` 够用前不要引入路由库。

## 5. 文件预算

| 门槛 | 行数 | 行为 |
|---|---|---|
| 软 | 300 | 还会继续涨则先提出拆分，由用户决定 |
| 硬 | 500 | `scripts/check-file-budget.mjs` 失败，已并进 `npm run typecheck` / `npm run check` |

范围：`src/**/*.{ts,tsx,css}`、`scripts/*.{js,mjs}`。图谱分片靠近 500 行就拆新分片并改路由表。

例外必须写进预算脚本的 `allowlist`（相对仓库根、正斜杠），不能口头豁免。适用于生成物、纯常量清单、一次性迁移脚本。

拆分原则：

- 一个文件一个理由：一个 use-case、一个控件、一个 store、一个 register。
- 禁止无名垃圾桶：不准 `utils.ts` / `helpers.ts` / `types.ts` / `common.ts`。要写就写带名词的文件名。
- `index.ts` 只允许组装，禁止 re-export 一堆模块当公共入口。
- 禁止中心 switch 加 case。新分支 = 新文件 + 注册一行。
- Zustand 一包一店。跨包数据走 IPC（main 为真源）或新建编排包。
- `main.css` 只放入口与 token。
- 注册表因 import 行数接近 200 时按域再拆，仍无业务逻辑。

当前包：`shell`（快照 + 最大化状态）、`preferences`（偏好 JSON）、`app-info`（关于用的 name/version）、`fs-browser`（根列 / 卷 / 单层列举+缓存 / 详情 / 路径解析 / 文件图标含 `.lnk`；**不做**默认整盘 MFT；渲染侧可复用 `FileBrowser`，工作空间 Popover 等场景嵌入）。
