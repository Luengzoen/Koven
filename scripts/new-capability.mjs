import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const name = process.argv[2] ?? ''

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('用法: node scripts/new-capability.mjs <kebab-name>')
  console.error('名称须为小写 kebab-case，例如 notes 或 window-layout')
  process.exit(1)
}

function toCamel(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

function toPascal(value) {
  const camel = toCamel(value)
  return `${camel.slice(0, 1).toUpperCase()}${camel.slice(1)}`
}

const camel = toCamel(name)
const pascal = toPascal(name)

function writeIfAbsent(filePath, contents) {
  if (existsSync(filePath)) {
    console.warn(`已存在，跳过: ${filePath}`)
    return
  }
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, contents, 'utf8')
  console.log(`已创建: ${filePath}`)
}

writeIfAbsent(
  join(projectRoot, 'src/shared/capabilities', `${name}.ts`),
  `import type { Result } from '../kernel/result'

export const ${camel}Ipc = {
  ping: '${name}:ping'
} as const

export type ${pascal}API = {
  ${camel}: {
    ping: () => Promise<Result<string>>
  }
}
`
)

writeIfAbsent(
  join(projectRoot, 'src/main/capabilities', name, 'register.ts'),
  `import { ipcMain } from 'electron'
import { ok } from '@shared/kernel/result'
import { ${camel}Ipc } from '@shared/capabilities/${name}'

export function register${pascal}(): void {
  ipcMain.handle(${camel}Ipc.ping, () => ok('${name}'))
}
`
)

writeIfAbsent(
  join(projectRoot, 'src/preload/capabilities', name, 'api.ts'),
  `import { ipcRenderer } from 'electron'
import { ${camel}Ipc, type ${pascal}API } from '@shared/capabilities/${name}'

export const ${camel}Api: ${pascal}API = {
  ${camel}: {
    ping: () => ipcRenderer.invoke(${camel}Ipc.ping)
  }
}
`
)

writeIfAbsent(
  join(projectRoot, 'src/renderer/src/capabilities', name, 'page.tsx'),
  `export function ${pascal}Page() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">${pascal}</h1>
    </section>
  )
}
`
)

console.log('')
console.log('骨架已生成。还须各加一行：')
console.log(`  src/shared/app-api.ts          AppAPI 交集加入 ${pascal}API`)
console.log(`  src/main/kernel/register-ipc.ts  register${pascal}()`)
console.log(`  src/preload/index.ts           ...${camel}Api`)
console.log(`  src/renderer/src/routes.ts     若有页面则注册 ${pascal}Page`)
console.log('只做界面、不需要 IPC 时，删掉 main/preload/shared 骨架，不要往注册表加空行。')
