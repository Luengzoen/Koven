import type {
  FsBrowserEntryDetail,
  FsBrowserListEntry,
  FsBrowserSelectionMode
} from '@shared/capabilities/fs-browser'
import type { AppError } from '@shared/kernel/result'

/** 解析 `*.png;*.jpg` / 数组 → 小写扩展名集合；空表示不限 */
export function parseAcceptExtensions(
  accept: string | string[] | undefined
): Set<string> | null {
  if (accept === undefined) return null
  const raw = Array.isArray(accept) ? accept.join(';') : accept
  const parts = raw
    .split(/[;,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return null

  const extensions = new Set<string>()
  for (const part of parts) {
    if (part === '*' || part === '*.*' || part === '.*') return null
    const cleaned = part.replace(/^\*\./, '').replace(/^\./, '').toLowerCase()
    if (cleaned) extensions.add(cleaned)
  }
  return extensions.size > 0 ? extensions : null
}

export function entryMatchesAccept(
  entry: FsBrowserListEntry,
  accept: Set<string> | null
): boolean {
  if (entry.kind === 'volume' || entry.kind === 'directory') return true
  if (!accept) return true
  return accept.has(entry.extension)
}

export function entryIsSelectable(
  entry: FsBrowserListEntry,
  mode: FsBrowserSelectionMode,
  accept: Set<string> | null
): boolean {
  if (entry.kind === 'this-pc' || entry.rootId === 'this-pc') return false
  if (entry.kind === 'volume') return mode === 'directory' || mode === 'mixed'
  if (entry.kind === 'directory') return mode === 'directory' || mode === 'mixed'
  if (mode === 'directory') return false
  if (!accept) return true
  return accept.has(entry.extension)
}

/** 可下钻打开下一列（有下级）：卷 / 目录 / 此电脑 */
export function entryCanDrill(entry: FsBrowserListEntry): boolean {
  return (
    entry.kind === 'volume' ||
    entry.kind === 'directory' ||
    entry.kind === 'this-pc'
  )
}

export type FileBrowserConfirmResult =
  | { ok: true; selection: FsBrowserListEntry[] }
  | { ok: false; reason: 'empty' | 'over-limit' | 'invalid' | 'cancelled'; message?: string }

export type FileBrowserProps = {
  /** 面板标题（可选；宿主传入已本地化文案） */
  title?: string
  /** 最大可选数量，默认 1 */
  maxCount?: number
  /** 选择模式，默认 file */
  mode?: FsBrowserSelectionMode
  /**
   * 文件类型过滤；空 / 未传 = 全部。
   * 支持 `*.png;*.jpg` 或 `['*.png','*.jpg']`
   */
  accept?: string | string[]
  /** 初始展开路径（存在则展开列链） */
  initialPath?: string
  /** 受控选中路径 */
  value?: string[]
  /** 非受控默认选中 */
  defaultValue?: string[]
  /** 是否显示隐藏项，默认 true（隐藏项降低不透明度） */
  showHidden?: boolean
  /** 是否显示系统项，默认 false */
  showSystem?: boolean
  /** 是否显示右侧详情，默认 true */
  showDetail?: boolean
  /** 列宽 px，默认 180 */
  columnWidth?: number
  /** 详情区宽 px，默认 220 */
  detailWidth?: number
  /** 整体高度，默认 320 */
  height?: number
  className?: string
  disabled?: boolean
  /**
   * 确认前校验。返回字符串视为失败原因（使用者文案）；
   * 返回 null 通过。
   */
  validate?: (
    selection: FsBrowserListEntry[]
  ) => string | null | Promise<string | null>
  /** 选中集合变化 */
  onChange?: (selection: FsBrowserListEntry[]) => void
  /** 键盘/鼠标聚焦行变化；无聚焦时 null */
  onFocusChange?: (entry: FsBrowserListEntry | null) => void
  /** 列路径链变化（导航） */
  onNavigate?: (columnPaths: string[]) => void
  /** 双击可选项或显式确认时 */
  onConfirm?: (
    selection: FsBrowserListEntry[]
  ) => void | Promise<void> | FileBrowserConfirmResult | Promise<FileBrowserConfirmResult>
  /** 取消 / Esc（由宿主弹层决定是否关闭） */
  onCancel?: () => void
  /** 主进程 / 加载错误 */
  onError?: (error: AppError) => void
  /** 详情加载完成（可选，便于宿主侧栏同步） */
  onDetailChange?: (detail: FsBrowserEntryDetail | null) => void
}
