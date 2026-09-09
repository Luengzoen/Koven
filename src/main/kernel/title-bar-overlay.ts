import { BrowserWindow, nativeTheme } from 'electron'

const overlayColors = {
  dark: { color: '#18181b', symbolColor: '#fafafa' },
  light: { color: '#f4f4f5', symbolColor: '#18181b' }
} as const

export function applyTitleBarOverlay(win: BrowserWindow): void {
  const palette = nativeTheme.shouldUseDarkColors ? overlayColors.dark : overlayColors.light
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
