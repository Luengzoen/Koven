import { mockProjects } from '@renderer/shell/sidebar/mock-projects'
import { ProjectRow } from '@renderer/shell/sidebar/project-row'
import { useState } from 'react'

export function ProjectsTree() {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(mockProjects[0] ? [mockProjects[0].id] : [])
  )

  function toggle(projectId: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-1 px-2 pb-2">
      <h2 className="shrink-0 px-2 text-xs font-medium tracking-wide text-zinc-500">
        Projects
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 pr-0.5">
          {mockProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              expanded={expandedIds.has(project.id)}
              onToggle={() => toggle(project.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
