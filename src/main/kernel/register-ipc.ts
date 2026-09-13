import { registerAppInfo } from '../capabilities/app-info/register'
import { registerPreferences } from '../capabilities/preferences/register'
import { registerShell } from '../capabilities/shell/register'
import { registerFsBrowser } from '../capabilities/fs-browser/register'

export function registerAllIpc(): void {
  registerAppInfo()
  registerShell()
  registerPreferences()
  registerFsBrowser()
}
