import type { ToolItemKind } from '@renderer/capabilities/task-chat/block-model'
import {
  FilePenIcon,
  FileSearchIcon,
  FileTextIcon,
  GlobeIcon,
  SearchIcon,
  TextSearchIcon,
  type LucideIcon
} from 'lucide-react'

export const toolItemIcons: Record<ToolItemKind, LucideIcon> = {
  web_search: SearchIcon,
  web_fetch: GlobeIcon,
  file_read: FileTextIcon,
  file_write: FilePenIcon,
  search_files: FileSearchIcon,
  grep: TextSearchIcon
}

/** 工具族标题栏用主 icon：取首个子项，缺省搜索 */
export function toolCallHeaderIcon(itemKinds: ToolItemKind[]): LucideIcon {
  const first = itemKinds[0]
  return first ? toolItemIcons[first] : SearchIcon
}
