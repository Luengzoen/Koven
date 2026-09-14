import { NewProjectPage } from '@renderer/capabilities/new-project/new-project-page'
import { PreferencesPage } from '@renderer/capabilities/preferences/preferences-page'
import { TaskChatPage } from '@renderer/capabilities/task-chat/task-chat-page'
import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { PlaceholderPage } from '@renderer/shell/placeholder-page'
import { isTaskPageId } from '@renderer/shell/draft-page'
import { HOME_PAGE_ID } from '@renderer/shell/page-ids'
import { parseTaskPageId } from '@shared/capabilities/projects'
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
  if (isTaskPageId(page.id)) {
    const taskId = parseTaskPageId(page.id)
    const live = taskId ? useProjectsStore.getState().getTaskById(taskId)?.title : undefined
    if (live) return live
  }
  return page.title ?? ''
}

function chromePage(id: string, titleKey: MessageKey, chrome?: AppPageChrome): AppPage {
  function Page() {
    return createElement(PlaceholderPage, { titleKey })
  }
  Page.displayName = `Page(${id})`
  return { id, titleKey, Page, chrome }
}

export const overviewPages: readonly AppPage[] = [
  chromePage(HOME_PAGE_ID, 'nav.myKoven'),
  chromePage('overview:recent', 'nav.scheduledTasks'),
  {
    id: 'overview:starred',
    titleKey: 'nav.newProject',
    Page: NewProjectPage
  }
]

export const preferencesPage: AppPage = {
  id: 'preferences',
  titleKey: 'nav.preferences',
  Page: PreferencesPage,
  chrome: { showBack: true }
}

export const pages: readonly AppPage[] = [...overviewPages, preferencesPage]

const pageMap = new Map(pages.map((entry) => [entry.id, entry]))
const taskPageCache = new Map<string, AppPage>()

function resolveTaskPage(pageId: string): AppPage | undefined {
  const taskId = parseTaskPageId(pageId)
  if (!taskId) return undefined
  const resolvedId: string = taskId
  const cached = taskPageCache.get(pageId)
  if (cached) {
    const task = useProjectsStore.getState().getTaskById(resolvedId)
    if (task && cached.title !== task.title) {
      const next = { ...cached, title: task.title }
      taskPageCache.set(pageId, next)
      return next
    }
    return cached
  }
  const task = useProjectsStore.getState().getTaskById(resolvedId)
  function Page() {
    return createElement(TaskChatPage, { taskId: resolvedId })
  }
  Page.displayName = `TaskChat(${resolvedId})`
  const entry: AppPage = {
    id: pageId,
    title: task?.title ?? '',
    Page
  }
  taskPageCache.set(pageId, entry)
  return entry
}

export function getPage(id: string): AppPage | undefined {
  const staticPage = pageMap.get(id)
  if (staticPage) return staticPage
  if (isTaskPageId(id)) return resolveTaskPage(id)
  return undefined
}

export function dropTaskPageCache(taskId: string): void {
  taskPageCache.delete(`task:${taskId}`)
}

const firstOverview = overviewPages[0]

if (!firstOverview) {
  throw new Error('至少需要注册一个 Overview 页面')
}

export const homePage = firstOverview
