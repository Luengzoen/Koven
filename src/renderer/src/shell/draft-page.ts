/** 新建项目草稿页：不进 keepalive */
export const DRAFT_PAGE_ID = 'overview:starred'

export function isDraftPageId(id: string): boolean {
  return id === DRAFT_PAGE_ID
}

export function isTaskPageId(id: string): boolean {
  return id.startsWith('task:')
}
