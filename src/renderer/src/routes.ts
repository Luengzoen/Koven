import { ShelfPage } from '@renderer/capabilities/shelf/shelf-page'
import type { ComponentType } from 'react'

export type AppPage = {
  id: string
  title: string
  Page: ComponentType
}

export const pages: readonly AppPage[] = [
  { id: 'shelf', title: 'Koven', Page: ShelfPage }
]

const firstPage = pages[0]

if (!firstPage) {
  throw new Error('至少需要注册一个页面')
}

export const homePage = firstPage
