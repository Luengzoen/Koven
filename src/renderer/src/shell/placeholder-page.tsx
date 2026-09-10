export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold text-zinc-100">{title}</h1>
      <p className="text-sm text-zinc-500">页面内容稍后提供</p>
    </section>
  )
}
