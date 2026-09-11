# Koven 知识图谱分片：06 状态（Zustand / IPC 数据）

> 路由：`knowledge/06-patterns-state.md`（路由表 knowledge-graph.md 的 06 号分片）
> 覆盖内容：Zustand selector、何时走 IPC、持久化落点
> 何时读：加客户端状态、持久化、跨窗口数据

## 1. 默认 Zustand，不要 RTK

桌面 UI 状态用 Zustand：无 Provider、按 selector 订阅、样板少。Redux Toolkit 仅在用户明确要求，或出现大规模规范化服务端缓存 / 复杂 middleware 时再评估。

写法：

```ts
const count = useCounterStore((state) => state.count)
```

禁止 `const store = useCounterStore()` 再解构整棵树（会失去细粒度订阅）。需要浅比较多个字段时用 `useShallow`。

**一包一店**。壳导航、首选项内部分类、偏好等各自独立 store。禁止恢复全局 mega store。内存演示计数类代码不要再引入。

跨包数据：走 IPC（main 为真源），或新建编排能力包。不要把两个 store 合并成一个大文件。

## 2. 什么留在 renderer，什么进 main

| 数据 | 放哪 |
|---|---|
| 仅当前窗口的 UI（弹层开关、输入草稿、计数演示） | Zustand（该能力包内） |
| 壳会话（窗口、侧栏、当前页） | main JSON：`getDataRoot()/capabilities/shell/snapshot.json` |
| 偏好（主题、语言、general 字体/字号） | main JSON：`getDataRoot()/capabilities/preferences/preferences.json`；UI：侧栏主题 segment + 首选项 General |
| 需要跨窗口、重启仍在、或碰磁盘/系统 | 主进程 + IPC，文件走 `kernel/storage.ts`（原子写） |
| 密钥、不可信输入、权限 | 只在 main；renderer 只拿最小结果 |

不要用 `localStorage` 当「持久化」。埋点 / 业务多行数据以后另仓，不塞进上述两份 JSON。

**落盘根目录例外**：安装/项目 `.data` 可写时一切在 `.data/`；不可写时 Electron 与能力 JSON **全量**回落到 `%APPDATA%\koven`（见 `02-modules-main.md`）。开发态经 `confine.js` 仍优先项目内。

## 2.5 壳会话与偏好（A/B JSON）

| 文件 | 域 |
|---|---|
| `…/capabilities/shell/snapshot.json` | B：窗口、导航页、侧栏选中、开合、宽度、首选项内部分类 `preferencesSectionId` |
| `…/capabilities/preferences/preferences.json` | A：theme / locale / general（`fontFamily` + `fontSize` 五档 + `closeBehavior`） |

### 版本迁移

读盘路径：`readJson` → `migrateJson(raw, CURRENT, steps)` → `normalize*` → 若 `migrated` 则原子写回。

- 通用：`src/main/kernel/migrate-json.ts`（`steps[i]` 负责 `i → i+1`；缺 version 视为 0）
- 壳：`SHELL_SCHEMA_VERSION` + `shellMigrations`（当前为 1，含 0→1 占位步）
- 偏好：`PREFERENCES_SCHEMA_VERSION` + `preferencesMigrations`
- 改字段形状时：**先加迁移步并 bump version**，不要只改 normalize 假装兼容

- 窗口几何：**仅 main** 在 move/resize（防抖）与 close 时写入；首次无快照或几何无效 → 1024×700 且主屏工作区居中。
- UI 导航/侧栏：renderer 防抖 `shell.patchUi`；启动 `hydrateSession`。含首选项内部分类 `navigation.preferencesSectionId`（`general` | `system`，非法回落 `general`）。
- 侧栏高亮与当前页可分离：`openFromSidebar` 二者同设；`open`（非侧栏入口）只换页并清空高亮。
- 导航返回栈 `backStack` 仅内存：换页时压入上一 `activeId`，`back()` 弹出并尽量恢复侧栏高亮；不写 shell 快照。
- 埋点 / 业务多行数据以后另仓，不塞进上述两份 JSON。

## 2.6 可观测性（阶段 A）

- 主进程 `appLog` → `getLogsRoot()/main.log`（可写时 `.data/logs`，回落时 `%APPDATA%\koven\logs`）
- 记：启动、路径模式、落盘/迁移失败；避免刷屏
- 不上远程 APM；以后可加「导出诊断包」（阶段 C）

## 3. 异步数据

主进程只读信息在组件 `useEffect` 里 `await window.koven.<name>....`，结果是 `Result<T>`，放 `useState` 或 Zustand。不要在模块顶层调用 IPC。

`window.koven?.` 可选链仅用于非 Electron 预览；**真窗口里 API 必须存在**，缺方法说明 preload 没跟上。
