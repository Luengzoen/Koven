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

## 坑 5：在浏览器打开 `localhost:5173` 信息一直「读取中…」或 IPC「不可用」

- **现象**：Vite 页能点菜单/样式，但没有 `window.koven`，应用信息/落盘不出现。
- **根因**：那是渲染进程开发服务器，**没有 preload**。
- **修复**：样式与纯客户端 Zustand 可用浏览器；IPC / 托盘 / 原生主题 / 落盘必须以 `npm start` 的 **Electron 窗口**为准（Agent 须先获用户授权）。可选链 `window.koven?.` 只防止预览崩掉，不能当集成测试。

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

- **现象**：装到 Program Files 后弹出「数据目录不可写」，或数据不在安装目录。
- **根因**：部分盘符上的 Program Files 继承了 Users 只读 ACL。
- **修复**：installer.nsh 的 `customInstall` 已 `icacls` 授权；默认装到 `D:\Program Files\Koven`。仍失败则改安装路径。产品策略：不可写时**不拒绝启动**，Electron 与能力 JSON **全量**落到系统默认 `%APPDATA%\koven` 并弹窗告知。

## 坑 11：NSIS 检测不到 D 盘

- **现象**：明明有 D 盘，却装到 C:\Program Files。
- **根因**：`${FileExists} "D:\"` 对盘符根恒假。
- **修复**：用 `"D:\*.*"`。installer.nsh 已按此写。

## 坑 12：Windows 下直接 spawn `electron-builder` ENOENT / `D:\Program` 不是命令

- **现象**：`npm run check` 通过后，前端构建或 pack 瞬间失败；回放出现 `'D:\Program' 不是内部或外部命令`。
- **根因**：① `.cmd` 包装脚本必须经 cmd.exe；② 对 `process.execPath`（常为 `D:\Program Files\nodejs\node.exe`）再开 `shell: true` 时，cmd 会在空格处拆命令。
- **修复**：打包走 `process.execPath` + `scripts/confine.js pack`；**仅**对 `npm` 保留 `shell: true`，对 `process.execPath` 关 shell（`build-win.mjs` 的 `runWithProgress`）。

## 坑 13：installer.nsh 中文乱码

- **现象**：卸载询问框乱码或宏没编进安装器。
- **根因**：NSIS 需要 UTF-8 BOM。
- **修复**：`build/installer.nsh` 必须带 BOM（EF BB BF）。

## 坑 14：托盘图标路径指到仓库外

- **现象**：`Failed to load image from path 'D:\Desktop\build\koven.ico'`。
- **根因**：运行时 `__dirname` 是 `out/main`，不是源码 `src/main/kernel`。多写一层 `../` 会跳出项目根。
- **修复**：dev 用 `join(__dirname, '../../build/koven.ico')`；preload/renderer 同理相对 `out/main` 用 `../`，不要按源码目录层数推。

## 坑 15：主题扩散「看不见 / 菜单消失 / 三按钮抢跑」

- **现象**：切主题无圆扩散、只有纯色、菜单动画中消失、或标题栏三按钮过早变色。
- **根因**（常见误改）：
  1. 克隆层未冻结 CSS 变量 → 一切 `html.dark` 两层同色；
  2. 依赖 View Transition / CSS mask transition → Electron 常无效；
  3. 先 `visibility:hidden` 真 Portal 再克隆 → 新层菜单带着 hidden；
  4. `preferences.set` 里同步 `nativeTheme` → 防抖落盘提前改 WCO。
- **修复**：保持 `apply-theme.ts` 现流程（冻结双层 + `circle()` rAF + Portal 进层后再藏真菜单 + 圆到右上角再 `applyTheme`）。细则见 `09-ui-spec.md`「实现禁区」。

## 坑 16：JSON 半截写入或升级后字段错乱

- **现象**：断电后 `snapshot.json` / `preferences.json` 损坏，或改字段后旧文件行为怪异。
- **根因**：非原子写会截断正式文件；只改 normalize 不 bump `version` 无法区分旧形状。
- **修复**：一律经 `storage.writeJson`（内部 `atomic-file-write`）；形状变更走 `migrate-json` 迁移步并提高 schema version。

## 坑 17：`npm run publish` 发错包 / 失败

- **现象**：上传了旧安装包；或报缺少 token / 无产物 / Release 已存在。
- **根因**：选包按 `dist/koven-*-setup.exe` 的 **mtime**，不是 `package.json` 版本；目录里留着历史包时，若刚打的包 mtime 不是最新会选错；缺 `GH_TOKEN`、未先 `build:win`、或同 tag 已发过都会失败。
- **修复**：发版前确认最新一次 `build:win` 已完成；`npm run publish -- --dry-run` 核对文件名与 tag；在项目根 `.env` 写 `GH_TOKEN=`（已 gitignore）或设会话级环境变量；已存在则删 Release/tag 或升版本重打。
