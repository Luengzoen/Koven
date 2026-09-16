import {
  demoId,
  rootPath,
  toolItem,
  type DemoEvent
} from '@renderer/capabilities/task-chat/mock/demo-event-model'
import { DEMO_FINAL_REPORT } from '@renderer/capabilities/task-chat/mock/demo-final-report'

/** 轮 3：网页 + MCP */
export function buildRoundDocs(): DemoEvent[] {
  const t3 = demoId('think')
  const b3 = demoId('body')
  const tools3 = demoId('tools')
  const webSearch = toolItem('web_search', 'electron-vite path alias resolve')
  const webFetch = toolItem(
    'web_fetch',
    'https://electron-vite.org/guide/dev.html#path-aliases'
  )
  const mcp1 = demoId('mcp')

  return [
    {
      op: 'append',
      path: rootPath,
      block: { id: t3, kind: 'thinking', status: 'running', content: '' },
      delayMs: 100
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: t3,
      field: 'content',
      text: '根因像是别名表与文档推荐不一致。查网页文档，再用 MCP 拉一版说明摘要。',
      chunkSize: 2,
      charDelayMs: 12
    },
    { op: 'patch', path: rootPath, blockId: t3, patch: { status: 'done' }, delayMs: 60 },
    {
      op: 'append',
      path: rootPath,
      block: { id: b3, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: b3,
      field: 'content',
      text: '对照官方路径别名说明，确认推荐写法后再改。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: rootPath, blockId: b3, patch: { status: 'done' }, delayMs: 50 },
    {
      op: 'append',
      path: rootPath,
      block: {
        id: tools3,
        kind: 'tool_call',
        status: 'running',
        toolName: '联网查阅',
        items: [webSearch, webFetch]
      }
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools3,
      itemId: webSearch.id,
      patch: { status: 'done' },
      delayMs: 260
    },
    {
      op: 'patchItem',
      path: rootPath,
      blockId: tools3,
      itemId: webFetch.id,
      patch: { status: 'done' },
      delayMs: 300
    },
    { op: 'patch', path: rootPath, blockId: tools3, patch: { status: 'done' }, delayMs: 70 },
    {
      op: 'append',
      path: rootPath,
      block: {
        id: mcp1,
        kind: 'mcp',
        status: 'running',
        mcpName: 'docs-mcp',
        functionName: 'lookup_guide',
        summary: ''
      },
      delayMs: 40
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: mcp1,
      field: 'summary',
      text: 'lookup_guide({ topic: "path-aliases", framework: "electron-vite" })',
      chunkSize: 4,
      charDelayMs: 8
    },
    { op: 'patch', path: rootPath, blockId: mcp1, patch: { status: 'done' }, delayMs: 100 }
  ]
}

/** 轮 5：终轮报告 */
export function buildRoundFinal(): DemoEvent[] {
  const t5 = demoId('think')
  const b5 = demoId('body')

  return [
    {
      op: 'append',
      path: rootPath,
      block: { id: t5, kind: 'thinking', status: 'running', content: '' },
      delayMs: 120
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: t5,
      field: 'content',
      text: '校验通过。整理步骤与结果，给出最终报告。',
      chunkSize: 2,
      charDelayMs: 12
    },
    { op: 'patch', path: rootPath, blockId: t5, patch: { status: 'done' }, delayMs: 60 },
    {
      op: 'append',
      path: rootPath,
      block: { id: b5, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: b5,
      field: 'content',
      text: DEMO_FINAL_REPORT,
      chunkSize: 12,
      charDelayMs: 6
    },
    { op: 'patch', path: rootPath, blockId: b5, patch: { status: 'done' }, delayMs: 80 }
  ]
}
