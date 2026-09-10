# Koven 知识图谱分片：03 preload

> 路由：`knowledge/03-modules-preload.md`（路由表 knowledge-graph.md 的 03 号分片）
> 覆盖内容：contextBridge、窄 API、sandbox 约束
> 何时读：改 `window.koven`、preload 依赖、sandbox

## 1. 职责

preload 在页面脚本之前运行，有有限的 Electron API，**没有完整 Node**（`sandbox: true`）。只做一件事：把白名单方法挂到 `window.koven`。

```ts
const api: AppAPI = { ...appInfoApi, ...shellApi, ...preferencesApi }
exposeApi(api)
```

`api` 的类型是 `AppAPI`（`src/shared/app-api.ts` 的交集组装）。各包方法在 `src/preload/capabilities/<name>/api.ts`。渲染进程通过 `window.koven.shell.getSnapshot()` / `window.koven.preferences.get()` 等命名空间调用。

## 2. 允许 / 禁止

| 允许 | 禁止 |
|---|---|
| `contextBridge`、`ipcRenderer` | `fs`、`path`、任意 npm 包 |
| `import type` 与会被打进单文件的共享常量 | 把整个 `ipcRenderer` 暴露给页面 |
| 编译成 **CJS** `out/preload/index.js` | `"type": "module"` 导致 preload 变成 `.mjs`（沙箱里不能当 ESM 跑） |

preload **不要**对 `node_modules` 做 `externalizeDeps` 后再去 require 第三方包。当前实现零第三方运行时依赖，保持这样。

## 3. 类型给渲染进程

`src/preload/index.d.ts` 扩展 `Window.koven: AppAPI`。`tsconfig.web.json` 已 include 该文件。新增方法时同步改：

1. `src/shared/capabilities/<name>.ts`（通道 + 该包 API 类型）
2. `src/shared/app-api.ts`（`AppAPI` 交集加一行）
3. `src/preload/capabilities/<name>/api.ts` + `index.ts` 展开
4. `src/main/capabilities/<name>/register.ts` + `register-ipc.ts` 一行
5. 本分片表格（若行为需要说明）
