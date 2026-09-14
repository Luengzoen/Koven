type HighlightTextProps = {
  text: string
  query: string
  className?: string
}

export function HighlightText({ text, query, className }: HighlightTextProps) {
  const q = query.trim()
  if (!q) return <span className={className}>{text}</span>

  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const parts: { value: string; hit: boolean }[] = []
  let cursor = 0
  while (cursor < text.length) {
    const index = lower.indexOf(needle, cursor)
    if (index < 0) {
      parts.push({ value: text.slice(cursor), hit: false })
      break
    }
    if (index > cursor) {
      parts.push({ value: text.slice(cursor, index), hit: false })
    }
    parts.push({ value: text.slice(index, index + needle.length), hit: true })
    cursor = index + needle.length
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.hit ? (
          <mark
            key={`${part.value}-${index}`}
            className="rounded-sm bg-accent px-0.5 text-inherit"
          >
            {part.value}
          </mark>
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        )
      )}
    </span>
  )
}
