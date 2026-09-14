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

## 坑 18：改文案 / HMR 后侧栏能点但主区一直停在「我的Koven」

- **现象**：热更新（尤其改 `catalog` / `routes`）后，点概览或其它导航，顶栏或内容仍像停在首页；重启 `npm run dev` 又正常。
- **根因**：Vite HMR 重建了 `useNavigationStore`，侧栏与 `KeepAliveOutlet` 可能短时间各绑不同 store 实例；叠加 `invisible` 叠层时，后访问的不透明页也可能盖住当前页。
- **修复**：`navigation-store.ts` 用 `import.meta.hot.data` 复用同一 store；`KeepAliveOutlet` 非当前页用 `hidden`。

## 坑 19：设置页 Dropdown「可点却看不见」

- **现象**：首选项等页点开下拉，键盘/点击能选中，但屏幕上看不见菜单（或只剩残影）。
- **根因**：① KeepAlive 当前页曾加 `z-10`，盖住挂到 `body` 的 Radix Portal；② Dialog/Dropdown Content 缺明确 `z-50`；③ 主题圆形扩散残留遮罩（`pointer-events-none` 的全屏层）挡住视线。
- **修复**：当前页不加 `z-10`；Portal 内容统一 `z-50`；主题切换后（及 AppShell 挂载时）调 `cleanupThemeCircleArtifacts()`。

## 坑 20：`.lnk` 直接 `getFileIcon` 得到白纸+箭头

- **现象**：分栏里快捷方式显示通用文档图标，而不是目标程序图标。
- **根因**：对 `.lnk` 路径调 `app.getFileIcon` 往往只拿到快捷方式壳图标。
- **修复**：`fs-browser:get-file-icon` 先 `shell.readShortcutLink`，再对 `icon` / `target` 取图标；展示名去掉 `.lnk` 后缀。

## 坑 21：暗色主题下分栏「伪选中」完全看不见

- **现象**：路径链父级（此电脑 / C: 等）逻辑上已是打开态，但行背景与周围一样。
- **根因**：暗色 token 里 `--muted` 与 `--card` 同为 `#18181b`；在 `bg-card` 上写 `bg-muted` 等于没高亮。不是 HMR/重启问题。
- **修复**：分栏行的聚焦 / 选中 / 路径链伪选中统一用 `bg-accent`（`#27272a`）。

## 坑 23：`Cannot access 'homePage' before initialization`

- **现象**：白屏；DevTools：`Uncaught ReferenceError: Cannot access 'homePage' before initialization`（`navigation-store.ts`）。
- **根因**：`routes` → `NewProjectPage` → `navigation-store` → 模块顶层读 `homePage`（尚在 TDZ）形成循环依赖。
- **修复**：固定首页 id 抽到 `shell/page-ids.ts` 的 `HOME_PAGE_ID`；导航 store 初始化只用该常量，不在顶层碰 `routes.homePage`。

## 坑 25：主进程改了但 Electron 仍跑旧逻辑（去重/删空项目不生效）

- **现象**：库里同路径出现多个项目；任务删光后空项目还在。源码已有去重/删空，测试也过。
- **根因**：`package.json` 的 `main` 指向 `out/main/index.js`；`npm run dev` 下**只有主进程文件变更才会重编并重启 Electron**。只改 `src/main` 后若终端已停、或仅渲染 HMR，运行中的仍是旧 `out/main`。
- **修复**：改主进程后须重新 `npm run dev`（或至少让 electron-vite 重建 main）。打开库时 `repairProjectIntegrity` 合并同路径项目、删除无未归档任务的空项目，并建 `lower(workspace_path)` 唯一索引。

## 坑 24：侧栏任务菜单确认气泡闪一下消失 / 重命名无焦点；下拉内试听首次选中并收起

- **现象**：归档/删除确认 Popover 刚出即关；重命名输入框出现后瞬间复原；菜单项「完全没反应」；完成提示音下拉里点播放会选中并关菜单。
- **根因**：① Dropdown 与 Popover 共 `Trigger`，关菜单的 dismiss/归还焦点会立刻关掉刚打开的 Popover；② 菜单 `onCloseAutoFocus` 把焦点拉回 trigger，重命名 input 失焦触发 blur 取消；③ **受控** `setMenuOpen(false)` **不会**再调 `onOpenChange`，动作不能只挂在那里；④ 关菜单后的残留 pointer/focus outside 会关掉刚打开的 Popover；⑤ Radix `MenuItem.onSelect` 早于子按钮 `onClick`。
- **修复**：`PopoverAnchor`；`DropdownMenuContent.onCloseAutoFocus` 一律 `preventDefault`；`onSelect` 里关菜单后 `setTimeout(~120ms)` 再重命名/开确认；确认气泡短时忽略 outside；重命名后约 220ms 内忽略 blur；试听在 `pointerDown` 置 flag。
