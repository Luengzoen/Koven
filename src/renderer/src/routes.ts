import { PreferencesPage } from '@renderer/capabilities/preferences/preferences-page'
import { PlaceholderPage } from '@renderer/shell/placeholder-page'
import { t, type LocaleId, type MessageKey } from '@shared/i18n'
import { createElement, type ComponentType } from 'react'

export type AppPageChrome = {
  /** 是否显示 topbar 返回按钮；由页面注册表维护 */
  showBack?: boolean
}

export type AppPage = {
  id: string
  /** 用户/任务内容标题（不参与 i18n） */
  title?: string
  /** 壳层页面标题的 i18n key */
  titleKey?: MessageKey
  Page: ComponentType
  chrome?: AppPageChrome
}

export function resolvePageTitle(page: AppPage | undefined, locale: LocaleId): string {
  if (!page) return ''
  if (page.titleKey) return t(locale, page.titleKey)
  return page.title ?? ''
}

function chromePage(id: string, titleKey: MessageKey, chrome?: AppPageChrome): AppPage {
  function Page() {
    return createElement(PlaceholderPage, { titleKey })
  }
  Page.displayName = `Page(${id})`
  return { id, titleKey, Page, chrome }
}

function taskPage(id: string, title: string): AppPage {
  function Page() {
    return createElement(PlaceholderPage, { title })
  }
  Page.displayName = `Page(${id})`
  return { id, title, Page }
}

export const overviewPages: readonly AppPage[] = [
  chromePage('overview:home', 'nav.overview'),
  chromePage('overview:recent', 'nav.recent'),
  chromePage('overview:starred', 'nav.starred')
]

export const taskPages: readonly AppPage[] = [
  taskPage('task:demo-1', '整理需求说明'),
  taskPage('task:demo-2', '核对发布清单'),
  taskPage('task:demo-3', '回顾上周进度')
]

export const preferencesPage: AppPage = {
  id: 'preferences',
  titleKey: 'nav.preferences',
  Page: PreferencesPage,
  chrome: { showBack: true }
}

export const pages: readonly AppPage[] = [...overviewPages, ...taskPages, preferencesPage]

const pageMap = new Map(pages.map((entry) => [entry.id, entry]))

export function getPage(id: string): AppPage | undefined {
  return pageMap.get(id)
}

const firstOverview = overviewPages[0]

if (!firstOverview) {
  throw new Error('至少需要注册一个 Overview 页面')
}

export const homePage = firstOverview
