import type { AppAPI } from '@shared/app-api'
import { appInfoApi } from './capabilities/app-info/api'
import { preferencesApi } from './capabilities/preferences/api'
import { shellApi } from './capabilities/shell/api'
import { fsBrowserApi } from './capabilities/fs-browser/api'
import { projectsApi } from './capabilities/projects/api'
import { exposeApi } from './kernel/expose-api'

const api: AppAPI = {
  ...appInfoApi,
  ...shellApi,
  ...preferencesApi,
  ...fsBrowserApi,
  ...projectsApi
}

exposeApi(api)
