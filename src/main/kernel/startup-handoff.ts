import type { BrowserWindow } from 'electron'
import { onShellUiReady } from '../capabilities/shell/register'
import { createMainWindow } from './create-main-window'
import { createSplashWindow } from './create-splash-window'
import { appLog } from './app-log'

const MIN_SPLASH_MS = 350
const CRT_EXIT_MS = 450

async function playSplashCrtExit(splash: BrowserWindow): Promise<void> {
  if (splash.isDestroyed()) return
  try {
    await splash.webContents.executeJavaScript(
      `document.documentElement.classList.add('splash-exit'); true`
    )
  } catch {
    // Splash 可能已卸载；仍按固定时长收尾
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, CRT_EXIT_MS)
  })
}

/** 先 Splash，主窗首帧就绪后关电视交接再显主窗 */
export function runStartupHandoff(): BrowserWindow {
  const splash = createSplashWindow()
  const splashShownAt = Date.now()
  const mainWindow = createMainWindow()

  let readyToShow = false
  let uiReady = false
  let handedOff = false

  const tryHandoff = (): void => {
    if (handedOff || !readyToShow || !uiReady) return
    handedOff = true

    const elapsed = Date.now() - splashShownAt
    const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed)

    setTimeout(() => {
      void (async () => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.show()
        }
        await playSplashCrtExit(splash)
        if (!splash.isDestroyed()) {
          splash.destroy()
        }
        appLog.info('app', 'startup handoff complete')
      })()
    }, waitMs)
  }

  mainWindow.once('ready-to-show', () => {
    readyToShow = true
    tryHandoff()
  })

  onShellUiReady(() => {
    uiReady = true
    tryHandoff()
  })

  return mainWindow
}
