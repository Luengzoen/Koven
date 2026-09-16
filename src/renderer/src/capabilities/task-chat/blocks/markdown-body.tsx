import { FenceFrame } from '@renderer/capabilities/task-chat/blocks/fence-frame'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ReactNode } from 'react'

type MarkdownBodyProps = {
  content: string
}

function flattenText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return flattenText(props?.children)
  }
  return ''
}

const components: Components = {
  table: ({ children }) => (
    <div className="my-3 max-w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-border bg-muted/30 px-3 py-1.5 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-1.5 whitespace-nowrap">{children}</td>
  ),
  p: ({ children }) => <p className="my-2 leading-6 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="cursor-pointer underline underline-offset-2 text-foreground"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const match = /language-([\w-]+)/.exec(className ?? '')
    const text = flattenText(children).replace(/\n$/, '')
    if (match) {
      return <FenceFrame language={match[1] ?? 'text'} code={text} />
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
    )
  },
  // FenceFrame 自带容器；去掉外层 pre，避免双重滚动条
  pre: ({ children }) => <>{children}</>
}

export function MarkdownBody({ content }: MarkdownBodyProps) {
  return (
    <div className="select-text text-sm text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
