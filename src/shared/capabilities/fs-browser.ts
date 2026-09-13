import type { Result } from '../kernel/result'

export const fsBrowserIpc = {
  listRoots: 'fs-browser:list-roots',
  listVolumes: 'fs-browser:list-volumes',
  listDirectory: 'fs-browser:list-directory',
  getEntryDetail: 'fs-browser:get-entry-detail',
  resolvePath: 'fs-browser:resolve-path',
  getFileIcon: 'fs-browser:get-file-icon'
} as const

/** 虚拟「此电脑」路径（非真实盘符） */
export const FS_BROWSER_THIS_PC_PATH = '::this-pc'

/** 选择模式：仅文件 / 仅目录 / 混选 */
export type FsBrowserSelectionMode = 'file' | 'directory' | 'mixed'

export type FsBrowserEntryKind = 'volume' | 'directory' | 'file' | 'this-pc'

export type FsBrowserRootId =
  | 'user'
  | 'documents'
  | 'pictures'
  | 'downloads'
  | 'desktop'
  | 'this-pc'

/** 列表行（列内渲染用，尽量轻） */
export type FsBrowserListEntry = {
  path: string
  name: string
  kind: FsBrowserEntryKind
  /** 扩展名小写，无点；目录/卷为空 */
  extension: string
  isHidden: boolean
  isSystem: boolean
  /** 根列快捷项；有值时界面用 i18n 覆盖 name */
  rootId?: FsBrowserRootId
}

/** 右侧详情（聚焦后按需拉取） */
export type FsBrowserEntryDetail = {
  path: string
  name: string
  kind: FsBrowserEntryKind
  extension: string
  sizeBytes: number | null
  modifiedAt: number | null
  createdAt: number | null
  accessedAt: number | null
  isHidden: boolean
  isSystem: boolean
  isReadonly: boolean
  /** 卷：标签与容量 */
  volumeLabel: string | null
  freeBytes: number | null
  totalBytes: number | null
  /** 目录：直接子项数量（尽力而为，失败为 null） */
  childCount: number | null
  rootId?: FsBrowserRootId
}

export type FsBrowserListDirectoryQuery = {
  path: string
  /** 是否包含隐藏项；默认 false */
  showHidden?: boolean
  /** 是否包含系统项；默认 false */
  showSystem?: boolean
}

export type FsBrowserListDirectoryResult = {
  path: string
  entries: FsBrowserListEntry[]
}

export type FsBrowserResolvePathResult = {
  /** 从根到目标的绝对路径链（可含 ::this-pc 或已知用户文件夹） */
  chain: string[]
  exists: boolean
  kind: FsBrowserEntryKind | null
}

export type FsBrowserAPI = {
  fsBrowser: {
    listRoots: () => Promise<Result<FsBrowserListEntry[]>>
    listVolumes: (options?: {
      showHidden?: boolean
    }) => Promise<Result<FsBrowserListEntry[]>>
    listDirectory: (
      query: FsBrowserListDirectoryQuery
    ) => Promise<Result<FsBrowserListDirectoryResult>>
    getEntryDetail: (path: string) => Promise<Result<FsBrowserEntryDetail>>
    resolvePath: (path: string) => Promise<Result<FsBrowserResolvePathResult>>
    /** 系统壳图标 PNG data URL；失败或空图为 null */
    getFileIcon: (path: string) => Promise<Result<string | null>>
  }
}
