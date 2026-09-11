import { screen, type Rectangle } from 'electron'
import {
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN
} from './sidebar-limits'
import type {
  ShellSnapshot,
  ShellUiPatch,
  ShellWindowBounds,
  ShellWindowState
} from '@shared/capabilities/shell'
import { normalizePreferencesSectionId } from '@shared/capabilities/shell'
import { appLog } from '../../kernel/app-log'
import { migrateJson, type MigrationStep } from '../../kernel/migrate-json'
import { readJson, writeJson } from '../../kernel/storage'

const CAPABILITY = 'shell'
const FILE = 'snapshot.json'
export const SHELL_SCHEMA_VERSION = 1

/** steps[i]: version i → i+1 */
export const shellMigrations: readonly MigrationStep[] = [
  // 0 → 1: unversioned / legacy blobs become v1 before normalize
  (raw) => raw
]

export const defaultWindowBounds = {
  width: 1024,
  height: 700,
  minWidth: 1024,
  minHeight: 700
} as const

export function createDefaultShellSnapshot(): ShellSnapshot {
  return {
    version: SHELL_SCHEMA_VERSION,
    window: {
      bounds: {
        x: 0,
        y: 0,
        width: defaultWindowBounds.width,
        height: defaultWindowBounds.height
      },
      maximized: false
    },
    navigation: {
      activePageId: 'overview:home',
      sidebarSelectedId: 'overview:home',
      preferencesSectionId: 'general'
    },
    sidebar: {
      open: true,
      width: SIDEBAR_WIDTH_DEFAULT
    }
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeBounds(value: unknown, fallback: ShellWindowBounds): ShellWindowBounds {
  if (!value || typeof value !== 'object') return fallback
  const record = value as Record<string, unknown>
  if (
    !isFiniteNumber(record.x) ||
    !isFiniteNumber(record.y) ||
    !isFiniteNumber(record.width) ||
    !isFiniteNumber(record.height)
  ) {
    return fallback
  }
  return {
    x: Math.round(record.x),
    y: Math.round(record.y),
    width: Math.round(record.width),
    height: Math.round(record.height)
  }
}

function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)))
}

export function normalizeShellSnapshot(raw: unknown): ShellSnapshot {
  const defaults = createDefaultShellSnapshot()
  if (!raw || typeof raw !== 'object') return defaults
  const record = raw as Record<string, unknown>

  const windowRaw = record.window
  let windowState: ShellWindowState = defaults.window
  if (windowRaw && typeof windowRaw === 'object') {
    const win = windowRaw as Record<string, unknown>
    windowState = {
      bounds: normalizeBounds(win.bounds, defaults.window.bounds),
      maximized: win.maximized === true
    }
  }

  const navigationRaw = record.navigation
  let navigation = defaults.navigation
  if (navigationRaw && typeof navigationRaw === 'object') {
    const nav = navigationRaw as Record<string, unknown>
    navigation = {
      activePageId:
        typeof nav.activePageId === 'string' && nav.activePageId.length > 0
          ? nav.activePageId
          : defaults.navigation.activePageId,
      sidebarSelectedId:
        typeof nav.sidebarSelectedId === 'string'
          ? nav.sidebarSelectedId
          : nav.sidebarSelectedId === null
            ? null
            : defaults.navigation.sidebarSelectedId,
      preferencesSectionId: normalizePreferencesSectionId(nav.preferencesSectionId)
    }
  }

  const sidebarRaw = record.sidebar
  let sidebar = defaults.sidebar
  if (sidebarRaw && typeof sidebarRaw === 'object') {
    const side = sidebarRaw as Record<string, unknown>
    sidebar = {
      open: side.open !== false,
      width: isFiniteNumber(side.width)
        ? clampSidebarWidth(side.width)
        : defaults.sidebar.width
    }
  }

  return {
    version: SHELL_SCHEMA_VERSION,
    window: windowState,
    navigation,
    sidebar
  }
}

export function isBoundsOnScreen(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return (
      bounds.x < area.x + area.width &&
      bounds.x + bounds.width > area.x &&
      bounds.y < area.y + area.height &&
      bounds.y + bounds.height > area.y
    )
  })
}

/** 相对主屏工作区居中（首次启动 / 无效落盘时用） */
export function centeredWindowBounds(width: number, height: number): ShellWindowBounds {
  const area = screen.getPrimaryDisplay().workArea
  return {
    width,
    height,
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2)
  }
}

function loadAndMigrateShellSnapshot(raw: unknown): ShellSnapshot {
  const migrated = migrateJson(raw, SHELL_SCHEMA_VERSION, shellMigrations)
  const normalized = normalizeShellSnapshot(migrated.value)

  if (migrated.migrated) {
    const written = writeJson(CAPABILITY, FILE, normalized)
    if (!written.ok) {
      appLog.error('shell', `migrate write failed: ${written.error.message}`)
    } else {
      appLog.info(
        'shell',
        `migrated snapshot.json v${migrated.fromVersion} → v${migrated.toVersion}`
      )
    }
  }

  return normalized
}

/** 磁盘无快照时返回 null（视为首次启动） */
export function tryLoadShellSnapshot(): ShellSnapshot | null {
  const result = readJson<unknown>(CAPABILITY, FILE)
  if (!result.ok) return null
  return loadAndMigrateShellSnapshot(result.value)
}

export function loadShellSnapshot(): ShellSnapshot {
  return tryLoadShellSnapshot() ?? createDefaultShellSnapshot()
}

export function saveShellSnapshot(snapshot: ShellSnapshot): void {
  const written = writeJson(CAPABILITY, FILE, normalizeShellSnapshot(snapshot))
  if (!written.ok) {
    appLog.error('shell', `save snapshot failed: ${written.error.message}`)
  }
}

export function patchShellUi(patch: ShellUiPatch): ShellSnapshot {
  const current = loadShellSnapshot()
  const next: ShellSnapshot = {
    ...current,
    navigation: patch.navigation ?? current.navigation,
    sidebar: patch.sidebar
      ? {
          open: patch.sidebar.open,
          width: clampSidebarWidth(patch.sidebar.width)
        }
      : current.sidebar
  }
  saveShellSnapshot(next)
  return next
}

export function saveShellWindowState(windowState: ShellWindowState): ShellSnapshot {
  const current = loadShellSnapshot()
  const next: ShellSnapshot = {
    ...current,
    window: {
      maximized: windowState.maximized,
      bounds: normalizeBounds(windowState.bounds, current.window.bounds)
    }
  }
  saveShellSnapshot(next)
  return next
}
