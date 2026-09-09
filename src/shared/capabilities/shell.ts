import type { Result } from '../kernel/result'

export const shellIpc = {
  isMaximized: 'shell:is-maximized',
  maximizedChanged: 'shell:maximized-changed'
} as const

export type ShellAPI = {
  shell: {
    isMaximized: () => Promise<Result<boolean>>
    onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
  }
}
