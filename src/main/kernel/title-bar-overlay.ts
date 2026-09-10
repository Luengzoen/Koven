import { BrowserWindow, nativeTheme } from 'electron'

const overlayColors = {
  dark: { color: '#18181b', symbolColor: '#fafafa' },
  light: { color: '#f4f4f5', symbolColor: '#18181b' }
} as const

/** @param dark 显式深浅；省略则读 nativeTheme.shouldUseDarkColors */
export function applyTitleBarOverlay(win: BrowserWindow, dark?: boolean): void {
  const useDark = dark ?? nativeTheme.shouldUseDarkColors
  const palette = useDark ? overlayColors.dark : overlayColors.light
  win.setTitleBarOverlay({
    color: palette.color,
    symbolColor: palette.symbolColor,
    height: 30
  })
}

export function watchTitleBarOverlayTheme(): void {
  nativeTheme.on('updated', () => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isDestroyed()) continue
      applyTitleBarOverlay(win)
    }
  })
}
