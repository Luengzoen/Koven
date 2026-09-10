import type { ThemePreference } from '@shared/capabilities/preferences'
import { resolveTheme, type ResolvedTheme } from '@renderer/shell/theme-resolve'
import { tokensFor } from '@renderer/shell/theme-tokens'

/**
 * 主题应用 + 圆形扩散（易碎，改前读 knowledge/09-ui-spec.md「实现禁区」与 08-pitfalls「主题扩散」）。
 * 禁止：只切 html.dark、纯色遮罩当扩散、先 hidden Portal 再克隆、在 preferences.set 里立刻改 WCO。
 */
export type ApplyThemeOptions = {
  preference: ThemePreference
  animate?: boolean
  x?: number
  y?: number
  /** 扩散圆碰到系统标题栏按钮区域时调用（同步 WCO）；无动画时立即调用 */
  onReachSystemChrome?: () => void
}

const DURATION_MS = 450
const CHROME_WIDTH = 140
const CHROME_HEIGHT = 30

let circleAnimating = false

type PortalSnap = {
  source: HTMLElement
  rect: DOMRect
}

function setRootClass(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

function circleRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )
}

function distanceToSystemChrome(x: number, y: number): number {
  const left = Math.max(0, window.innerWidth - CHROME_WIDTH)
  const nearestX = Math.min(Math.max(x, left), window.innerWidth)
  const nearestY = Math.min(Math.max(y, 0), CHROME_HEIGHT)
  return Math.hypot(x - nearestX, y - nearestY)
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function freezeTheme(el: HTMLElement, theme: ResolvedTheme): void {
  const tokens = tokensFor(theme)
  for (const [name, value] of Object.entries(tokens)) {
    el.style.setProperty(name, value)
    el.style.setProperty(name.replace('--', '--color-'), value)
  }
  el.style.color = tokens['--foreground']
}

/** Radix 等 Portal 弹出层（在 #root 外） */
function snapshotOpenPortals(): PortalSnap[] {
  const root = document.getElementById('root')
  const found = new Set<HTMLElement>()

  document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach((el) => {
    if (el instanceof HTMLElement && !root?.contains(el)) found.add(el)
  })
  document.querySelectorAll('[data-radix-menu-content], [role="menu"]').forEach((el) => {
    if (!(el instanceof HTMLElement) || root?.contains(el)) return
    const wrap = el.closest('[data-radix-popper-content-wrapper]')
    found.add(wrap instanceof HTMLElement ? wrap : el)
  })

  return [...found].map((source) => ({
    source,
    rect: source.getBoundingClientRect()
  }))
}

function setPortalVisibility(portals: PortalSnap[], visible: boolean): void {
  for (const { source } of portals) {
    if (!source.isConnected) continue
    source.style.visibility = visible ? '' : 'hidden'
  }
}

function pinPortalClone(source: HTMLElement, rect: DOMRect, theme: ResolvedTheme): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement
  // 必须显式 visible：若在隐藏真菜单后再克隆，会把 visibility:hidden 拷进来
  Object.assign(clone.style, {
    position: 'absolute',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${Math.max(rect.width, 1)}px`,
    minHeight: `${Math.max(rect.height, 1)}px`,
    margin: '0',
    transform: 'none',
    zIndex: '10',
    pointerEvents: 'none',
    visibility: 'visible',
    opacity: '1'
  })
  freezeTheme(clone, theme)
  clone.querySelectorAll<HTMLElement>('*').forEach((node) => {
    if (node.style.visibility === 'hidden') node.style.visibility = 'visible'
  })
  return clone
}

/** 整窗层：#root + 打开的 Portal 菜单，颜色冻结 */
function buildOverlayLayer(
  theme: ResolvedTheme,
  zIndex: string,
  portals: PortalSnap[]
): HTMLElement {
  const app = document.getElementById('root')
  if (!app) throw new Error('missing #root')

  const tokens = tokensFor(theme)
  const stack = document.createElement('div')
  stack.setAttribute('data-theme-circle', '')
  stack.setAttribute('aria-hidden', 'true')
  Object.assign(stack.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    margin: '0',
    zIndex,
    pointerEvents: 'none',
    overflow: 'hidden',
    background: tokens['--background']
  })
  freezeTheme(stack, theme)

  const rootClone = app.cloneNode(true) as HTMLElement
  rootClone.removeAttribute('id')
  Object.assign(rootClone.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    margin: '0',
    zIndex: '1'
  })
  freezeTheme(rootClone, theme)
  stack.appendChild(rootClone)

  for (const { source, rect } of portals) {
    if (!source.isConnected) continue
    stack.appendChild(pinPortalClone(source, rect, theme))
  }

  return stack
}

function setCircleClip(el: HTMLElement, x: number, y: number, radius: number): void {
  el.style.clipPath = `circle(${Math.max(radius, 0)}px at ${x}px ${y}px)`
}

function expandRevealFromPoint(
  x: number,
  y: number,
  current: ResolvedTheme,
  next: ResolvedTheme,
  apply: () => void,
  onReachSystemChrome?: () => void
): void {
  document.querySelectorAll('[data-theme-circle]').forEach((node) => node.remove())

  const portals = snapshotOpenPortals()
  let oldLayer: HTMLElement
  let newLayer: HTMLElement
  let livePortals = portals

  try {
    oldLayer = buildOverlayLayer(current, '2147483645', portals)
    document.body.appendChild(oldLayer)
    apply()
    const portalsAfter = snapshotOpenPortals()
    livePortals = portalsAfter.length > 0 ? portalsAfter : portals
    newLayer = buildOverlayLayer(next, '2147483646', livePortals)
    document.body.appendChild(newLayer)
    // 两层都带菜单克隆后再藏真菜单，避免 hidden 被克隆进新层
    setPortalVisibility(portals, false)
    setPortalVisibility(livePortals, false)
  } catch {
    setPortalVisibility(portals, true)
    setPortalVisibility(livePortals, true)
    apply()
    onReachSystemChrome?.()
    return
  }

  const radius = circleRadius(x, y)
  const chromeAt = distanceToSystemChrome(x, y)
  setCircleClip(newLayer, x, y, 0)
  circleAnimating = true

  let finished = false
  let chromeNotified = false
  const notifyChrome = (): void => {
    if (chromeNotified) return
    chromeNotified = true
    onReachSystemChrome?.()
  }

  const finish = (): void => {
    if (finished) return
    finished = true
    notifyChrome()
    oldLayer.remove()
    newLayer.remove()
    setPortalVisibility(portals, true)
    setPortalVisibility(livePortals, true)
    circleAnimating = false
  }

  const startedAt = performance.now()
  const tick = (now: number): void => {
    if (finished) return
    const t = Math.min(1, (now - startedAt) / DURATION_MS)
    const currentRadius = radius * easeOutCubic(t)
    setCircleClip(newLayer, x, y, currentRadius)
    if (currentRadius >= chromeAt) notifyChrome()
    if (t < 1) {
      requestAnimationFrame(tick)
      return
    }
    finish()
  }
  requestAnimationFrame(tick)
}

export function applyTheme(options: ApplyThemeOptions): void {
  const next = resolveTheme(options.preference)
  const current: ResolvedTheme = document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light'

  if (next === current) return

  if (!options.animate) {
    if (circleAnimating) return
    setRootClass(next)
    options.onReachSystemChrome?.()
    return
  }

  if (
    options.x === undefined ||
    options.y === undefined ||
    prefersReducedMotion()
  ) {
    setRootClass(next)
    options.onReachSystemChrome?.()
    return
  }

  expandRevealFromPoint(
    options.x,
    options.y,
    current,
    next,
    () => {
      setRootClass(next)
    },
    options.onReachSystemChrome
  )
}
