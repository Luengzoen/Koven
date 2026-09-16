import type { DemoEvent } from '@renderer/capabilities/task-chat/mock/demo-event-model'
import { buildRoundSkillAndShell } from '@renderer/capabilities/task-chat/mock/demo-round-skill'
import { buildRoundLocate, buildRoundRead } from '@renderer/capabilities/task-chat/mock/demo-rounds-early'
import { buildRoundDocs, buildRoundFinal } from '@renderer/capabilities/task-chat/mock/demo-rounds-late'

export type { DemoEvent, DemoPath } from '@renderer/capabilities/task-chat/mock/demo-event-model'

/**
 * 多轮合理 loop：思考→正文→动作→回归，可重复；终轮最终报告。
 * 任意用户输入共用此剧本。
 */
export function buildDemoEvents(): DemoEvent[] {
  return [
    ...buildRoundLocate(),
    ...buildRoundRead(),
    ...buildRoundDocs(),
    ...buildRoundSkillAndShell(),
    ...buildRoundFinal()
  ]
}
