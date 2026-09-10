# Koven 知识图谱分片：08 踩坑与排障

> 路由：`knowledge/08-pitfalls.md`（路由表 knowledge-graph.md 的 08 号分片）
> 覆盖内容：开发过程中遇到的坑与其解法（现象 → 根因 → 修复）
> 何时读：遇到报错、行为异常、排障

## 坑 1：Electron zip / 运行时写到 `%LOCALAPPDATA%\electron`

- **现象**：项目外出现 `AppData\Local\electron\Cache`，或 `node_modules/electron/dist` 是空的但安装显示成功。
- **根因**：`@electron/get` 默认缓存用 `env-paths` → 用户 LocalAppData。Electron 44 起二进制改为首次运行再下载。
- **修复**：`.npmrc` 的 `electron_config_cache` + `confine.js` 设置 `ELECTRON_CACHE`；`postinstall` 跑 `electron/install.js`。检查应以 `dir node_modules\electron\dist` 为准（部分搜索工具会漏掉 `electron.exe`）。

## 坑 2：主进程 import 顺序导致隔离失效

- **现象**：仍出现 `%APPDATA%\koven` 或系统 Temp 下的 Chromium 文件。
- **根因**：静态 `import { app } from 'electron'` 会先于模块体执行。若 `env.ts` 也 import electron，环境变量来不及设。
- **修复**：`env.ts` 只动 `fs`/`path`/`process.env`；`index.ts` 第一行 `import './env'`，然后再 `startApp()`。`app.setPath` 在 `kernel/apply-isolated-paths.ts`，仍须发生在 electron 模块求值之后、窗口创建之前。

## 坑 3：`sandbox: true` 时 preload 加载失败

- **现象**：控制台 `Unable to load preload script` / `module not found` / `Cannot use import statement outside a module`。
- **根因**：沙箱 preload 没有完整 Node；ESM `.mjs` 不能当沙箱脚本。第三方包若被 externalize，运行时 require 不到。
- **修复**：保持 `package.json` 无 `"type": "module"`，preload 打成 CJS；preload 只依赖 `electron`；不要对 preload 打进需 Node 的包。

## 坑 4：TS 报 `baseUrl` 已弃用

- **现象**：`tsconfig.node.json` / `tsconfig.web.json` 报选项 `baseUrl` 将在 TypeScript 7.0 停止工作。
- **根因**：TS 6 弃用 `baseUrl`；`paths` 早已不需要它。
- **修复**：删除 `baseUrl`，把映射写成相对本文件的路径（`"@shared/*": ["./src/shared/*"]`）。不要用 `ignoreDeprecations` 当长期方案。

## 坑 5：在浏览器打开 `localhost:5173` 信息一直「读取中…」

- **现象**：Vite 页能点计数和菜单，但 Electron/Chrome/Node/数据目录不出现。
- **根因**：那是渲染进程开发服务器，没有 preload，`window.koven` 不存在。
- **修复**：以 `npm start` 打开的 **Electron 窗口** 为准验证 IPC。可选链 `window.koven?.` 只防止预览崩掉。

## 坑 6：绕过 confine 启动

- **现象**：直接 `electron .` 或全局 electron，缓存/用户数据写到系统目录。
- **根因**：环境变量与 TEMP 重定向只在 `scripts/confine.js` 里设置。
- **修复**：只用 `npm start` / `npm run dev` / `npm run preview`。

## 坑 7：Tailwind 类不生效

- **现象**：utility class 没样式。
- **根因**：本项目是 Vite 插件接入的 v4，不是 PostCSS `@tailwindcss/postcss`，也不是 v3 的 `tailwind.config.js`。
- **修复**：确认 `electron.vite.config.ts` renderer 有 `tailwindcss()`；CSS 有 `@import "tailwindcss"`；类写在 renderer 的 `.tsx` 里。改配置后重启 `npm start`。

## 坑 8：未安装依赖时的 TS 假报错

- **现象**：找不到 `electron` / `react` / JSX 命名空间。
- **根因**：`node_modules` 未装好，语言服务没有类型。
- **修复**：在项目内 `npm install`（走 `.npmrc` 缓存）。不是业务代码错误。

## 坑 9：electron-builder 把 NSIS 工具下到用户 AppData

- **现象**：出现 `%LOCALAPPDATA%\electron-builder` 或系统 Temp 下的 winCodeSign/nsis。
- **根因**：builder 默认缓存不在项目内；直接跑 `electron-builder` 不走 confine。
- **修复**：只用 `npm run build:win`。confine 设置 `ELECTRON_BUILDER_CACHE=.electron-builder-cache` 与 npmmirror 的 binaries mirror。

## 坑 10：安装包内写不进 `.data`

- **现象**：装到 Program Files 后启动失败或弹出「数据目录不可写」。
- **根因**：部分盘符上的 Program Files 继承了 Users 只读 ACL。
- **修复**：installer.nsh 的 `customInstall` 已 `icacls` 授权；默认装到 `D:\Program Files\Koven`。仍失败则改安装路径。不要为了省事改回静默写系统 AppData（仅不可写时才回退默认位置并弹窗）。

## 坑 11：NSIS 检测不到 D 盘

- **现象**：明明有 D 盘，却装到 C:\Program Files。
- **根因**：`${FileExists} "D:\"` 对盘符根恒假。
- **修复**：用 `"D:\*.*"`。installer.nsh 已按此写。

## 坑 12：Windows 下直接 spawn `electron-builder` ENOENT

- **现象**：build:win 走到打包环节无输出就退出。
- **根因**：`.cmd` 包装脚本必须经 cmd.exe；且 `node_modules/.bin` 不在非 npm 的 PATH。
- **修复**：打包走 `process.execPath` + `scripts/confine.js pack`；对 `npm` 命令保留 `shell: true`。

## 坑 13：installer.nsh 中文乱码

- **现象**：卸载询问框乱码或宏没编进安装器。
- **根因**：NSIS 需要 UTF-8 BOM。
- **修复**：`build/installer.nsh` 必须带 BOM（EF BB BF）。

## 坑 14：托盘图标路径指到仓库外

- **现象**：`Failed to load image from path 'D:\Desktop\build\koven.ico'`。
- **根因**：运行时 `__dirname` 是 `out/main`，不是源码 `src/main/kernel`。多写一层 `../` 会跳出项目根。
- **修复**：dev 用 `join(__dirname, '../../build/koven.ico')`；preload/renderer 同理相对 `out/main` 用 `../`，不要按源码目录层数推。
