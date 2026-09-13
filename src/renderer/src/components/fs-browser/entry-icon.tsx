import type { FsBrowserListEntry, FsBrowserRootId } from '@shared/capabilities/fs-browser'
import { isShortcutEntry } from '@renderer/components/fs-browser/display-name'
import { ShortcutIcon } from '@renderer/components/fs-browser/shortcut-icon'
import {
  AppWindowIcon,
  CircleUserIcon,
  ComputerIcon,
  DatabaseIcon,
  DownloadIcon,
  FileCodeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FilesIcon,
  FilmIcon,
  FolderDownIcon,
  FolderIcon,
  FolderOpenIcon,
  HardDriveIcon,
  ImageIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  MonitorIcon,
  MusicIcon,
  PresentationIcon,
  UserIcon,
  type LucideIcon
} from 'lucide-react'

const iconClass = 'size-3.5 shrink-0 text-muted-foreground'

export type FileIconCategory =
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'text'
  | 'audio'
  | 'video'
  | 'code'
  | 'other'

const IMAGE_EXT = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  'ico',
  'heic',
  'heif',
  'avif',
  'tif',
  'tiff'
])

const WORD_EXT = new Set(['doc', 'docx', 'odt', 'rtf', 'wps'])
const SHEET_EXT = new Set(['xls', 'xlsx', 'ods', 'csv', 'et'])
const SLIDE_EXT = new Set(['ppt', 'pptx', 'odp', 'dps'])
const PDF_EXT = new Set(['pdf'])
const TEXT_EXT = new Set(['txt', 'log', 'md', 'markdown'])
const AUDIO_EXT = new Set(['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'opus'])
const VIDEO_EXT = new Set([
  'mp4',
  'mkv',
  'avi',
  'mov',
  'wmv',
  'webm',
  'm4v',
  'flv',
  'mpeg',
  'mpg'
])
const CODE_EXT = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'json',
  'jsonc',
  'py',
  'rs',
  'go',
  'java',
  'kt',
  'c',
  'cc',
  'cpp',
  'cxx',
  'h',
  'hpp',
  'cs',
  'swift',
  'rb',
  'php',
  'html',
  'htm',
  'css',
  'scss',
  'less',
  'sass',
  'vue',
  'svelte',
  'xml',
  'yml',
  'yaml',
  'toml',
  'ini',
  'sh',
  'bash',
  'zsh',
  'ps1',
  'bat',
  'cmd',
  'sql',
  'graphql',
  'gql',
  'r',
  'lua',
  'dart',
  'zig'
])

export function categorizeFileExtension(extension: string): FileIconCategory {
  const ext = extension.toLowerCase()
  if (!ext) return 'other'
  if (IMAGE_EXT.has(ext)) return 'image'
  if (PDF_EXT.has(ext)) return 'pdf'
  if (WORD_EXT.has(ext)) return 'document'
  if (SHEET_EXT.has(ext)) return 'spreadsheet'
  if (SLIDE_EXT.has(ext)) return 'presentation'
  if (TEXT_EXT.has(ext)) return 'text'
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (VIDEO_EXT.has(ext)) return 'video'
  if (CODE_EXT.has(ext)) return 'code'
  return 'other'
}

const FILE_CATEGORY_ICON: Record<FileIconCategory, LucideIcon> = {
  image: ImageIcon,
  document: FileTextIcon,
  spreadsheet: FileSpreadsheetIcon,
  presentation: PresentationIcon,
  pdf: FileTextIcon,
  text: FileIcon,
  audio: MusicIcon,
  video: FilmIcon,
  code: FileCodeIcon,
  other: FileIcon
}

const ROOT_ICONS: Record<
  FsBrowserRootId,
  { closed: LucideIcon; open: LucideIcon }
> = {
  user: { closed: UserIcon, open: CircleUserIcon },
  documents: { closed: FileTextIcon, open: FilesIcon },
  pictures: { closed: ImageIcon, open: ImagesIcon },
  downloads: { closed: DownloadIcon, open: FolderDownIcon },
  desktop: { closed: AppWindowIcon, open: LayoutDashboardIcon },
  'this-pc': { closed: MonitorIcon, open: ComputerIcon }
}

type EntryIconProps = {
  entry: FsBrowserListEntry
  /** 该行是否已展开到下一列 */
  open?: boolean
  className?: string
}

export function EntryIcon({ entry, open = false, className = iconClass }: EntryIconProps) {
  if (entry.rootId) {
    const pair = ROOT_ICONS[entry.rootId]
    const Icon = open ? pair.open : pair.closed
    return <Icon className={className} aria-hidden />
  }

  if (entry.kind === 'this-pc') {
    const Icon = open ? ComputerIcon : MonitorIcon
    return <Icon className={className} aria-hidden />
  }

  if (entry.kind === 'volume') {
    const Icon = open ? DatabaseIcon : HardDriveIcon
    return <Icon className={className} aria-hidden />
  }

  if (entry.kind === 'directory') {
    const Icon = open ? FolderOpenIcon : FolderIcon
    return <Icon className={className} aria-hidden />
  }

  if (isShortcutEntry(entry)) {
    return <ShortcutIcon entry={entry} className={className} />
  }

  const category = categorizeFileExtension(entry.extension)
  const Icon = FILE_CATEGORY_ICON[category]
  return <Icon className={className} aria-hidden />
}
