import { homePage } from '@renderer/routes'
import { TitleBar } from '@renderer/shell/title-bar'

export function AppShell() {
  const Page = homePage.Page

  return (
    <div className="flex h-full min-h-full flex-col">
      <TitleBar />
      <main className="flex flex-1 items-center justify-center p-6">
        <Page />
      </main>
    </div>
  )
}
