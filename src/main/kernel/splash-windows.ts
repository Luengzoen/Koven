import type { BrowserWindow } from 'electron'

const splashIds = new Set<number>()

export function trackSplashWindow(win: BrowserWindow): void {
  splashIds.add(win.id)
  win.once('closed', () => {
    splashIds.delete(win.id)
  })
}

export function isSplashWindow(win: BrowserWindow): boolean {
  return splashIds.has(win.id)
}
