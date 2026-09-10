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
- 覆盖层（Dialog / Dropdown）不要手写抢 z-index；跟 Radix Portal
- 按钮要 `cursor-pointer`（v4 Preflight 默认是箭头）
- 图标在按钮内用组件上的 `[&_svg]:size-4`，不要在每个图标上堆 `size-4`

## 3. Radix 组合

| 场景 | 用什么 | 约定 |
|---|---|---|
| 按钮 | `Button`（Slot + cva） | default / primary / outline / ghost；icon 用 `size="icon"` |
| 对话框 | `Dialog` | 必须有 `DialogTitle`（可视或 `sr-only`）；关闭钮要有「关闭」可读名称；关于用居中紧凑布局。首选项是主区导航页，不用 Dialog |
| 页面顶栏 | `PageTopbar` | 侧栏按钮固定；居中 `AppPage.title`；返回由 `chrome.showBack` 开关（箭头 + 上一页 title，无 title 则仅箭头） |
| 菜单 | `DropdownMenu` | `Item` 放在 `Group` 里；危险项以后用独立约定，不要 `window.confirm` |
| 分割线 | `Separator` | 不要手写 `hr` 或 `border-t` 当语义分割 |
| 滑条 | `Slider` | 离散刻度 + 胶囊拇指；下方稀疏标签（如字号「小/默认/大」）；轨道用 `foreground`/`border` 等语义色适配明暗 |
| 开关 | `Switch` | 二态；未选中在左、选中在右；轨道始终灰色激活底（`muted-foreground/40`，双主题），圆点样式不变 |

新增 primitive：先加 Radix 包装到 `components/ui/`，页面只组合，不把 Overlay/Portal 散落在业务文件里。本地离散控件（如 Slider）也可放 `components/ui/`，不强制上 Radix。

## 4. 主题与文字

清爽明暗双主题；界面主体黑白灰。暗色用 `html.dark`（`@custom-variant dark`）。偏好：`system` / `light` / `dark`，落盘见 `06-patterns-state.md`。

文字：General 可选 Win 常见中文字体（下拉项用对应 `font-family` 预览）与五档字号（极小…大，默认标准）。`applyTypography` 写 `--font-sans-family` / `--font-scale`；`main.css` 的 `@theme` 用 `calc(基准 * var(--font-scale))` 定义 `--text-xs`…`--text-3xl`。禁止新写 `text-[Npx]`，用 `text-*` 以便跟档。控制高度（`h-*`）不随字号涨。System：关闭行为 `closeBehavior`（`tray` | `quit`，默认托盘）。

### 语义 token（`main.css`）

布局/字色用语义类，**禁止**新 UI 硬编码 `zinc-*` 当底色/字色。

| Token | 用途 |
|---|---|
| `background` / `foreground` | 页面底与主字色 |
| `muted` / `muted-foreground` | 次级底与次级字 |
| `border` / `card` / `accent` | 边框、卡片、悬停底 |
| `titlebar` | 自定义标题栏底（对齐 WCO overlay） |
| `ring` | 焦点环 |

语义色（双主题各有值，极个别场景用）：`primary`（工具蓝）、`success`（绿）、`danger`（红）、`warning`（黄）、`info`（常规信息色）。对应 `*-foreground` 为其上文字色。

切换：侧栏「系统设置」菜单内「主题」+ segment；扩散与 WCO 时机见下方「实现禁区」。首次 hydrate / 跟随系统无动画。字体族与五档字号在「首选项 → General」可改并落盘（`applyTypography`）。语言偏好仍落盘，界面文案尚未跟 locale 切换。

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

**例外**：占位导航页可用「页面内容稍后提供」这类说明。旧 `capabilities/shelf/shelf-page.tsx` 若再挂路由，技术栈文案必须先改成使用者语言。
