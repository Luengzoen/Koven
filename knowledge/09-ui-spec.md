# Koven 知识图谱分片：09 UI 规范

> 路由：`knowledge/09-ui-spec.md`（路由表 knowledge-graph.md 的 09 号分片）
> 覆盖内容：Radix + Tailwind 约定、组件组合、给使用者看的文案
> 何时读：改界面、加组件、写给使用者看的文案

## 1. 技术基础

- **Radix primitives**（本项目未接 shadcn CLI）+ **Tailwind v4** + **lucide-react** + **cva** + `cn()`（`src/renderer/src/lib/cn.ts`）
- 可复用控件在 `src/renderer/src/components/ui/`
- 图标只用 lucide，禁止为常规图标手写 SVG
- 触发器要原生按钮语义时：Radix `Trigger asChild` + 自有 `Button`

## 2. Tailwind 写法

- 布局用 `flex` + `gap-*`，**不用** `space-x-*` / `space-y-*`
- 宽高相等用 `size-*`，不用同时写 `w-* h-*`
- 条件 class 用 `cn()`，不要手写长模板字符串三元
- 覆盖层（Dialog / Dropdown / Popover）Portal Content **统一 `z-50`**；不要另起随机 z-index 战争。KeepAlive 当前页**禁止** `z-10`（会压住 body Portal）
- 按钮要 `cursor-pointer`（v4 Preflight 默认是箭头）
- 图标在按钮内用组件上的 `[&_svg]:size-4`，不要在每个图标上堆 `size-4`
- **默认不可拖选**：`main.css` 全局 `user-select: none`（输入框 / textarea / contenteditable 仍可拖选）。聊天消息、关于文案等需要复制的区域再加 Tailwind `select-text`
- **默认 focus 描边**：全局 `:focus:not(:focus-visible) { outline: none }`，去掉鼠标点击后残留的浏览器默认框；键盘导航仍走 `:focus-visible`（控件可再加 `focus-visible:ring-*`）

## 3. Radix 组合

| 场景 | 用什么 | 约定 |
|---|---|---|
| 按钮 | `Button`（Slot + cva） | default / outline / ghost 为主；`primary` 属功能色，仅明确要求时用；icon 用 `size="icon"` |
| 对话框 | `Dialog` | Overlay/Content 带 `z-50`；必须有 `DialogTitle`（可视或 `sr-only`）；关闭钮要有「关闭」可读名称；关于用居中紧凑布局。首选项是主区导航页，不用 Dialog |
| 页面顶栏 | `PageTopbar` | 侧栏按钮固定；居中 `AppPage.title`；返回由 `chrome.showBack` 开关（箭头 + 上一页 title，无 title 则仅箭头） |
| 菜单 | `DropdownMenu` | `Item` 放在 `Group` 里；Content 带 `z-50`；进出场动画写在 `components/ui/dropdown-menu`（`koven-menu-in/out`），业务侧勿再各自加一套；危险项以后用独立约定，不要 `window.confirm` |
| 提示 | `Tooltip` | 图标钮 / 截断路径等悬停说明；文案走 i18n；壳层包一层 `TooltipProvider`；Content 带 `z-50`；禁用钮外包一层可悬停元素 |
| 锚点面板 | `Popover` | 可嵌复杂交互（如文件分栏选择器）；Content 带 `z-50`；轻微弹性缩放写在 `components/ui/popover`（`koven-popover-in/out`）；四边轻阴影用 `--shadow-popover`（明暗各一套）；业务侧勿再各自加一套；不要用 Dropdown 塞大块可点内容 |
| 分割线 | `Separator` | 不要手写 `hr` 或 `border-t` 当语义分割 |
| 滑条 | `Slider` | 离散刻度 + 胶囊拇指；下方稀疏标签（如字号「小/默认/大」）；轨道用 `foreground`/`border` 等语义色适配明暗 |
| 开关 | `Switch` | 二态；未选中在左、选中在右；轨道始终灰色激活底（`muted-foreground/40`，双主题），圆点样式不变 |
| 编辑框容器 | `FocusFrame` | **凡 `input` / `textarea` 必包一层**。常态 1px `border`；`:focus-within` 时缓入 0.5px 亮边（`scale(0.5)`）+ 四边轻外发光（`--shadow-focus-glow`），失焦缓出。圆角用 `radius`（`md`/`lg`/`xl`/`composer`），禁再手写 focus ring |
| 搜索框 | `SearchField` | 带自绘清除钮（`cursor-pointer`）；隐藏原生 clear。新搜索框用本组件，勿裸写 `type="search"` |

新增 primitive：先加 Radix 包装到 `components/ui/`，页面只组合，不把 Overlay/Portal 散落在业务文件里。本地离散控件（如 Slider）也可放 `components/ui/`，不强制上 Radix。

## 4. 主题与文字

清爽明暗双主题；界面主体黑白灰。暗色用 `html.dark`（`@custom-variant dark`）。偏好：`system` / `light` / `dark`，落盘见 `06-patterns-state.md`。

文字：General 可选 Win 常见中文字体（下拉项用对应 `font-family` 预览；产品名两语均保留中文）与五档字号（极小…大，默认标准），以及界面语言（简体中文 / English）。`applyTypography` 写 `--font-sans-family` / `--font-scale`；`main.css` 的 `@theme` 用 `calc(基准 * var(--font-scale))` 定义 `--text-xs`…`--text-3xl`。禁止新写 `text-[Npx]`，用 `text-*` 以便跟档。控制高度（`h-*`）不随字号涨。System：关闭行为 `closeBehavior`（`tray` | `quit`，默认托盘）。

文案：壳层 / 设置 / 关于 / 托盘等使用者可见字符串走 `src/shared/i18n`（`t` / `useT`），禁止在组件里硬编码双语。项目名与任务名（用户数据）不进词典。`locale` 落盘后切换立即生效（同步 `html[lang]`；主进程重建托盘菜单），不弹重启对话框。

### 语义 token（`main.css`）

布局/字色用语义类，**禁止**新 UI 硬编码 `zinc-*` 当底色/字色。

| Token | 用途 |
|---|---|
| `background` / `foreground` | 页面底与主字色 |
| `muted` / `muted-foreground` | 次级底与次级字 |
| `border` / `card` / `accent` | 边框、卡片、悬停底 |
| `titlebar` | 自定义标题栏底（对齐 WCO overlay） |
| `ring` | 焦点环 |
| 滚动条（`--scrollbar-*`） | 全局细滚动条：透明轨道、胶囊拇指；明暗各自调拇指透明度 |

**功能色慎用（默认不上）**：`primary` / `success` / `danger` / `warning` / `info` 仅在下列情况使用——

1. 开发者**明确要求**用功能色；或  
2. **不得不用**（如任务成功/失败状态必须靠颜色传达语义）。

日常 UI（按钮、链接、返回、强调文案、边框）一律用黑白灰语义 token（`foreground` / `muted` / `border` / `accent`…）。token 可留在 `main.css` 备着，**禁止**习惯性给主按钮、返回链、标题点缀上蓝/绿/红。`Button variant="primary"` 同理，默认用 `default` / `outline` / `ghost`。

切换：侧栏「系统设置」菜单内「主题」+ segment；扩散与 WCO 时机见下方「实现禁区」。首次 hydrate / 跟随系统无动画。字体族、五档字号与语言在「首选项 → 通用」可改并落盘（`applyTypography` / `setLocale`）。

### 实现禁区（改主题动画前必读）

入口：`src/renderer/src/shell/apply-theme.ts`（色板 `theme-tokens.ts`）。**不要**为了「简化」改成只切 `html.dark` 或纯色遮罩。

已踩过、禁止回退的约束：

1. **克隆层必须冻结字面量 CSS 变量**（`freezeTheme`）——否则一切 `html.dark` 新旧两层同色，扩散等于消失。
2. **用 `clip-path: circle()` + rAF**——Electron 上 View Transition / CSS `transition` mask 不可靠。
3. **Radix Portal 菜单要进扩散层**——先建好旧/新两层克隆，再 `visibility:hidden` 藏真菜单；切勿先藏再克隆（会把 `hidden` 拷进新层）。
4. **WCO 三按钮不能进 DOM 扩散**——等圆碰到右上角区域再 `preferences.applyTheme`；`preferences.set` 只落盘、不改 nativeTheme。
5. 业务 UI 只调 `applyTheme` / `ThemeSegment`，不要在页面里再写一套切主题。

排障细节见 `08-pitfalls.md`「主题扩散」。

## 5. 文案（给使用者看，不是给开发看）

对应 **AGENTS.md 铁律 15**。注释和图谱可以写实现；**产品界面不可以。**

只说「能做什么 / 出了什么状况」。

| 错（实现外泄） | 对（使用者语言） |
|---|---|
| Electron + React + Radix + Zustand | 按产品定位写一句话能力 |
| 渲染进程没有 Node 权限 | 本应用在本机运行，设置保存在本机 |
| `.data/userData` / IPC `app-info:get` | 不要出现在界面 |
| 读取中…（开发占位可） | 产品里用「正在加载」或骨架屏 |

**例外**：占位导航页可用「页面内容稍后提供」这类说明。
