import {
  demoId,
  rootPath,
  toolItem,
  type DemoEvent
} from '@renderer/capabilities/task-chat/mock/demo-event-model'

/** 轮 1：定位文件 */
export function buildRoundLocate(): DemoEvent[] {
  const t1 = demoId('think')
  const b1 = demoId('body')
  const tools1 = demoId('tools')
  const itemSearch = toolItem('search_files', '**/vite.config.*')
  const itemGrep = toolItem('grep', 'alias|resolve\\.alias')

  return [
    {
      op: 'append',
      path: rootPath,
      block: { id: t1, kind: 'thinking', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: t1,
      field: 'content',
      text: '用户要修路径别名。先在仓库里搜配置文件名，再用内容搜索确认 alias 写法。',
      chunkSize: 2,
      charDelayMs: 12
    },
    { op: 'patch', path: rootPath, blockId: t1, patch: { status: 'done' }, delayMs: 80 },
    {
      op: 'append',
      path: rootPath,
      block: { id: b1, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: b1,
      field: 'content',
      text: '先定位 Vite / electron-vite 相关配置，确认别名定义落在哪里。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: rootPath, blockId: b1, patch: { status: 'done' }, delayMs: 60 },
    {
      op: 'append',
      path: rootPath,
      block: {
        id: tools1,
        kind: 'tool_call',
        status: 'running',
        toolName: '搜索工作区',
        items: [itemSearch, itemGrep]
      },
      delayMs: 40
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools1,
      itemId: itemSearch.id,
      patch: { status: 'done' },
      delayMs: 280
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools1,
      itemId: itemGrep.id,
      patch: { status: 'done' },
      delayMs: 220
    },
    { op: 'patch', path: rootPath, blockId: tools1, patch: { status: 'done' }, delayMs: 80 }
  ]
}

/** 轮 2：并行读取 */
export function buildRoundRead(): DemoEvent[] {
  const t2 = demoId('think')
  const b2 = demoId('body')
  const tools2 = demoId('tools')
  const readA = toolItem('file_read', 'vite.config.ts')
  const readB = toolItem('file_read', 'tsconfig.web.json')
  const readC = toolItem('file_read', 'electron.vite.config.ts')

  return [
    {
      op: 'append',
      path: rootPath,
      block: { id: t2, kind: 'thinking', status: 'running', content: '' },
      delayMs: 120
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: t2,
      field: 'content',
      text: '命中若干配置文件。并行读取，核对 @renderer / @shared 是否一致。',
      chunkSize: 2,
      charDelayMs: 12
    },
    { op: 'patch', path: rootPath, blockId: t2, patch: { status: 'done' }, delayMs: 60 },
    {
      op: 'append',
      path: rootPath,
      block: { id: b2, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: b2,
      field: 'content',
      text: '接下来并行读取候选配置，找出不一致的别名映射。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: rootPath, blockId: b2, patch: { status: 'done' }, delayMs: 50 },
    {
      op: 'append',
      path: rootPath,
      block: {
        id: tools2,
        kind: 'tool_call',
        status: 'running',
        toolName: '读取文件',
        items: [readA, readB, readC]
      }
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools2,
      itemId: readA.id,
      patch: { status: 'done' },
      delayMs: 200
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools2,
      itemId: readC.id,
      patch: { status: 'done' },
      delayMs: 160
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools2,
      itemId: readB.id,
      patch: { status: 'done' },
      delayMs: 180
    },
    { op: 'patch', path: rootPath, blockId: tools2, patch: { status: 'done' }, delayMs: 70 }
  ]
}
