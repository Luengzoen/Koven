import type { AppAPI } from '@shared/app-api'

declare global {
  interface Window {
    koven: AppAPI
  }
}

export {}
