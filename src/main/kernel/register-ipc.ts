import { registerAppInfo } from '../capabilities/app-info/register'
import { registerShell } from '../capabilities/shell/register'

export function registerAllIpc(): void {
  registerAppInfo()
  registerShell()
}
