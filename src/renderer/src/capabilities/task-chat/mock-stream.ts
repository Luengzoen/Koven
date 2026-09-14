export type ChatRole = 'user' | 'assistant'

export type ChatBlockKind = 'thinking' | 'body'

export type ChatMessage = {
  id: string
  role: ChatRole
  /** 用户消息纯文本；助手消息可拆思考/正文 */
  content: string
  thinking?: string
  streaming?: boolean
}

const MOCK_THINKING =
  '先理解你的目标，再整理可执行步骤，最后给出清晰答复。'

const MOCK_BODY =
  '好的。我已记下这次请求，并据此整理了初步思路。后续你可以继续补充细节，我会在同一任务里接着往下做。'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function mockStreamAssistant(options: {
  onThinking: (text: string) => void
  onBody: (text: string) => void
  signal?: { cancelled: boolean }
}): Promise<void> {
  let thinking = ''
  for (const char of MOCK_THINKING) {
    if (options.signal?.cancelled) return
    thinking += char
    options.onThinking(thinking)
    await sleep(18)
  }
  await sleep(220)
  let body = ''
  for (const char of MOCK_BODY) {
    if (options.signal?.cancelled) return
    body += char
    options.onBody(body)
    await sleep(16)
  }
}

export function createUserMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content
  }
}

export function createAssistantPlaceholder(): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: '',
    thinking: '',
    streaming: true
  }
}
