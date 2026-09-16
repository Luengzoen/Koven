type FenceFrameProps = {
  language: string
  code: string
}

/** 围栏壳：标题仅类型；内容区暂原文（针对性渲染后期再说） */
export function FenceFrame({ language, code }: FenceFrameProps) {
  const label = language.trim() || 'text'
  return (
    <div className="my-3 w-full overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
        {label}
      </div>
      <pre className="max-w-full overflow-x-auto bg-card/60 p-3 text-xs leading-5 text-foreground">
        <code className="select-text font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}
