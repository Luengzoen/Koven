import { PreferencesPage } from '@renderer/capabilities/preferences/preferences-page'
import { PlaceholderPage } from '@renderer/shell/placeholder-page'
import { createElement, type ComponentType } from 'react'

export type AppPageChrome = {
  /** 是否显示 topbar 返回按钮；由页面注册表维护 */
  showBack?: boolean
}

export type AppPage = {
  id: string
  title: string
  Page: ComponentType
  chrome?: AppPageChrome
}

function page(id: string, title: string, chrome?: AppPageChrome): AppPage {
  function Page() {
    return createElement(PlaceholderPage, { title })
  }
  Page.displayName = `Page(${id})`
  return { id, title, Page, chrome }
}

export const overviewPages: readonly AppPage[] = [
  page('overview:home', '概览'),
  page('overview:recent', '最近'),
  page('overview:starred', '收藏')
]

export const taskPages: readonly AppPage[] = [
  page('task:demo-1', '整理需求说明'),
  page('task:demo-2', '核对发布清单'),
  page('task:demo-3', '回顾上周进度')
]

export const preferencesPage: AppPage = {
  id: 'preferences',
  title: '首选项',
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
