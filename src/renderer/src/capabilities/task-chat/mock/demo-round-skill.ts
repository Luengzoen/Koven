import {
  demoId,
  rootPath,
  toolItem,
  type DemoEvent,
  type DemoPath
} from '@renderer/capabilities/task-chat/mock/demo-event-model'

/** 轮 4：skill 子 loop + 终端 */
export function buildRoundSkillAndShell(): DemoEvent[] {
  const t4 = demoId('think')
  const b4 = demoId('body')
  const skill1 = demoId('skill')
  const skillPath: DemoPath = { type: 'skill', skillBlockId: skill1 }
  const skillThink = demoId('skill-think')
  const skillBody1 = demoId('skill-body')
  const skillWrite = demoId('skill-write')
  const writeItem = toolItem('file_write', 'vite.config.ts')
  const skillBody2 = demoId('skill-body2')
  const t4b = demoId('think')
  const b4b = demoId('body')
  const shell1 = demoId('shell')

  return [
    {
      op: 'append',
      path: rootPath,
      block: { id: t4, kind: 'thinking', status: 'running', content: '' },
      delayMs: 100
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: t4,
      field: 'content',
      text: '资料齐了。调用 apply-path-alias skill 写入修复，再用终端跑校验。',
      chunkSize: 2,
      charDelayMs: 12
    },
    { op: 'patch', path: rootPath, blockId: t4, patch: { status: 'done' }, delayMs: 60 },
    {
      op: 'append',
      path: rootPath,
      block: { id: b4, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: b4,
      field: 'content',
      text: '交由 skill 应用别名修复，随后在终端验证类型检查。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: rootPath, blockId: b4, patch: { status: 'done' }, delayMs: 50 },
    {
      op: 'append',
      path: rootPath,
      block: {
        id: skill1,
        kind: 'skill',
        status: 'running',
        skillName: 'apply-path-alias',
        blocks: []
      },
      delayMs: 40
    },
    {
      op: 'append',
      path: skillPath,
      block: { id: skillThink, kind: 'thinking', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: skillPath,
      blockId: skillThink,
      field: 'content',
      text: '按指南合并 alias，保持 @renderer 与 @shared 指向项目内目录。',
      chunkSize: 2,
      charDelayMs: 11
    },
    { op: 'patch', path: skillPath, blockId: skillThink, patch: { status: 'done' }, delayMs: 50 },
    {
      op: 'append',
      path: skillPath,
      block: { id: skillBody1, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: skillPath,
      blockId: skillBody1,
      field: 'content',
      text: '正在写入 `vite.config.ts` 的 resolve.alias。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: skillPath, blockId: skillBody1, patch: { status: 'done' }, delayMs: 40 },
    {
      op: 'append',
      path: skillPath,
      block: {
        id: skillWrite,
        kind: 'tool_call',
        status: 'running',
        toolName: '写入文件',
        items: [writeItem]
      }
    },
    {
      op: 'patchItem',
      path: skillPath,
      blockId: skillWrite,
      itemId: writeItem.id,
      patch: { status: 'done' },
      delayMs: 320
    },
    { op: 'patch', path: skillPath, blockId: skillWrite, patch: { status: 'done' }, delayMs: 60 },
    {
      op: 'append',
      path: skillPath,
      block: { id: skillBody2, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: skillPath,
      blockId: skillBody2,
      field: 'content',
      text: '别名已写入。结果交回主任务继续校验。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: skillPath, blockId: skillBody2, patch: { status: 'done' }, delayMs: 40 },
    { op: 'patch', path: rootPath, blockId: skill1, patch: { status: 'done' }, delayMs: 80 },
    {
      op: 'append',
      path: rootPath,
      block: { id: t4b, kind: 'thinking', status: 'running', content: '' },
      delayMs: 100
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: t4b,
      field: 'content',
      text: 'skill 已回报。用 pwsh 跑类型检查确认无回归。',
      chunkSize: 2,
      charDelayMs: 12
    },
    { op: 'patch', path: rootPath, blockId: t4b, patch: { status: 'done' }, delayMs: 50 },
    {
      op: 'append',
      path: rootPath,
      block: { id: b4b, kind: 'body', status: 'running', content: '' }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: b4b,
      field: 'content',
      text: '在终端执行类型检查，确认修复有效。',
      chunkSize: 3,
      charDelayMs: 10
    },
    { op: 'patch', path: rootPath, blockId: b4b, patch: { status: 'done' }, delayMs: 40 },
    {
      op: 'append',
      path: rootPath,
      block: {
        id: shell1,
        kind: 'shell',
        status: 'running',
        shellName: 'pwsh',
        command: ''
      }
    },
    {
      op: 'streamText',
      path: rootPath,
      blockId: shell1,
      field: 'command',
      text: 'npm run typecheck',
      chunkSize: 2,
      charDelayMs: 20
    },
    { op: 'patch', path: rootPath, blockId: shell1, patch: { status: 'done' }, delayMs: 400 }
  ]
}
