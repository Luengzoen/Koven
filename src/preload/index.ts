import type { AppAPI } from '@shared/app-api'
import { appInfoApi } from './capabilities/app-info/api'
import { shellApi } from './capabilities/shell/api'
import { exposeApi } from './kernel/expose-api'

const api: AppAPI = {
  ...appInfoApi,
  ...shellApi
}

exposeApi(api)
