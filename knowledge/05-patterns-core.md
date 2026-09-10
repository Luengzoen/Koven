# Koven 知识图谱分片：05 核心心智（三进程边界 / 共享类型）

> 路由：`knowledge/05-patterns-core.md`（路由表 knowledge-graph.md 的 05 号分片）
> 覆盖内容：三进程边界 / 共享类型 / 禁止事项
> 何时读：新建模块时判断代码该落哪一端

## 1. 三进程，不是前后端目录

Electron 没有 Next 那种 Server Component。边界按**进程**：

| 进程 | 可以做什么 | 不能做什么 |
|---|---|---|
| 主进程 `src/main` | `fs`、窗口、`app.setPath`、`ipcMain` | 直接操作 React 状态 |
| preload `src/preload` | `contextBridge` + `ipcRenderer` | Node 模块、业务 UI |
| 渲染进程 `src/renderer` | React、DOM、Zustand、Radix | `fs`、改系统路径、裸 IPC |

口诀：**系统能力进 main，白名单进 preload，界面进 renderer。**

增量落点按能力包切开，见 `10-architecture.md`。不要把新逻辑写进各进程的入口薄壳。

## 2. 共享层

`src/shared` 只放**两端都能静态导入**的类型与常量（IPC 通道名、DTO、`Result`）。不要在 shared 里 import `electron` 或 `react`。

- 每包合约：`src/shared/capabilities/<name>.ts`
- 总 API：`src/shared/app-api.ts` 只做交集，不堆通道与 DTO

新增 IPC 一次改：包合约 → preload 包 api → main 包 register，并在三端注册表各加一行。漏一处就是类型谎言或运行时 `undefined`。

IPC 返回 `Result<T, AppError>`（`src/shared/kernel/result.ts`），不要每个包自造错误形状。

## 3. 复用放哪

| 复用什么 | 放哪 |
|---|---|
| 窗口/文件/系统 | `src/main/kernel/` 或该包 `src/main/capabilities/<name>/` |
| 给页面调用的能力 | `window.koven.<name>.*`（preload 包 api + shared 合约） |
| UI 控件 | `src/renderer/src/components/ui/` |
| 客户端状态 | 该包目录下的 Zustand store；**壳级**导航/侧栏/偏好在 `src/renderer/src/shell/` |
| 跨进程 DTO | `src/shared/capabilities/` |

## 4. 明确禁止

- 渲染进程 `nodeIntegration: true` 或 `sandbox: false`（除非用户书面要求并改本分片）。
- `@electron-toolkit/preload` 那种把 `ipcRenderer` 整包挂到 `window.electron`。
- 在 renderer 写相对路径去读项目文件。
- 为了省事把业务逻辑只写在 main 又在 renderer 用 `any` 调 IPC。
- 无名垃圾桶文件：`utils.ts` / `helpers.ts` / `types.ts` / `common.ts`。
- main 去 import `src/renderer`。
