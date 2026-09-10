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
| 按钮 | `Button`（Slot + cva） | default / outline / ghost；icon 用 `size="icon"` |
| 对话框 | `Dialog` | 必须有 `DialogTitle`（可视或 `sr-only`）；关闭钮要有「关闭」可读名称 |
| 菜单 | `DropdownMenu` | `Item` 放在 `Group` 里；危险项以后用独立约定，不要 `window.confirm` |
| 分割线 | `Separator` | 不要手写 `hr` 或 `border-t` 当语义分割 |

新增 primitive：先加 Radix 包装到 `components/ui/`，页面只组合，不把 Overlay/Portal 散落在业务文件里。

## 4. 主题

当前演示面是锌色暗色硬编码（`zinc-950` 等）。产品化时再抽语义 token（`background` / `foreground` / `muted`），抽完同步改本分片。未抽之前，新 UI 跟现有 zinc 体系，不要混入另一套蓝灰。

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
