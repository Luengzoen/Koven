import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const name = process.argv[2] ?? ''

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('用法: npm run new:capability -- <kebab-name>')
  console.error('名称须为小写 kebab-case，例如 notes 或 window-layout')
  console.error('会生成四端骨架，并自动改 app-api / register-ipc / preload 注册表。')
  console.error('只做界面、不要 IPC：不要跑本命令；只在 renderer 加页面并改 routes.ts。')
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

function readText(relPath) {
  return readFileSync(join(projectRoot, relPath), 'utf8')
}

function writeText(relPath, contents) {
  writeFileSync(join(projectRoot, relPath), contents, 'utf8')
  console.log(`已更新: ${relPath}`)
}

function insertAfterLastMatch(text, regex, line) {
  const matches = [...text.matchAll(regex)]
  if (matches.length === 0) {
    return null
  }
  const last = matches[matches.length - 1]
  const at = last.index + last[0].length
  return `${text.slice(0, at)}${line}\n${text.slice(at)}`
}

function patchAppApi() {
  const rel = 'src/shared/app-api.ts'
  let text = readText(rel)
  let changed = false

  if (!text.includes(`from './capabilities/${name}'`)) {
    const next = insertAfterLastMatch(
      text,
      /^import type \{[^}]+\} from '\.\/capabilities\/[^']+'\r?\n/gm,
      `import type { ${pascal}API } from './capabilities/${name}'`
    )
    if (!next) {
      throw new Error(`${rel}: 找不到 capabilities 的 import type 行`)
    }
    text = next
    changed = true
  }

  const apiMatch = text.match(/^export type AppAPI = (.+)$/m)
  if (!apiMatch) {
    throw new Error(`${rel}: 找不到 export type AppAPI`)
  }
  if (!apiMatch[1].includes(`${pascal}API`)) {
    text = text.replace(
      /^export type AppAPI = (.+)$/m,
      `export type AppAPI = ${apiMatch[1]} & ${pascal}API`
    )
    changed = true
  }

  if (changed) writeText(rel, text)
  else console.warn(`已注册，跳过: ${rel} (${pascal}API)`)
}

function patchRegisterIpc() {
  const rel = 'src/main/kernel/register-ipc.ts'
  let text = readText(rel)
  let changed = false

  if (!text.includes(`from '../capabilities/${name}/register'`)) {
    const next = insertAfterLastMatch(
      text,
      /^import \{ register\w+ \} from '\.\.\/capabilities\/[^']+\/register'\r?\n/gm,
      `import { register${pascal} } from '../capabilities/${name}/register'`
    )
    if (!next) {
      throw new Error(`${rel}: 找不到 register* import`)
    }
    text = next
    changed = true
  }

  if (!text.includes(`register${pascal}()`)) {
    const fnMatch = text.match(
      /export function registerAllIpc\(\): void \{\r?\n((?:  register\w+\(\)\r?\n)*)\}/
    )
    if (!fnMatch) {
      throw new Error(`${rel}: 找不到 registerAllIpc 函数体`)
    }
    text = text.replace(
      fnMatch[0],
      `export function registerAllIpc(): void {\n${fnMatch[1]}  register${pascal}()\n}`
    )
    changed = true
  }

  if (changed) writeText(rel, text)
  else console.warn(`已注册，跳过: ${rel} (register${pascal})`)
}

function patchPreloadIndex() {
  const rel = 'src/preload/index.ts'
  let text = readText(rel)
  let changed = false

  if (!text.includes(`from './capabilities/${name}/api'`)) {
    const next = insertAfterLastMatch(
      text,
      /^import \{ \w+Api \} from '\.\/capabilities\/[^']+\/api'\r?\n/gm,
      `import { ${camel}Api } from './capabilities/${name}/api'`
    )
    if (!next) {
      throw new Error(`${rel}: 找不到 *Api import`)
    }
    text = next
    changed = true
  }

  if (!text.includes(`...${camel}Api`)) {
    const apiMatch = text.match(
      /const api: AppAPI = \{\r?\n((?:  \.\.\.\w+Api,?\r?\n)*)\}/
    )
    if (!apiMatch) {
      throw new Error(`${rel}: 找不到 const api: AppAPI 组装块`)
    }
    let body = apiMatch[1]
    body = body.replace(/(\.\.\.\w+Api)(\r?\n)/g, '$1,$2')
    body = `${body}  ...${camel}Api\n`
    text = text.replace(apiMatch[0], `const api: AppAPI = {\n${body}}`)
    changed = true
  }

  if (changed) writeText(rel, text)
  else console.warn(`已注册，跳过: ${rel} (${camel}Api)`)
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

patchAppApi()
patchRegisterIpc()
patchPreloadIndex()

console.log('')
console.log(`能力包 "${name}" 骨架与三端注册表已就绪。`)
console.log('接下来：')
console.log('  1. 把 ping 换成真实 use-case（shared 合约 → preload api → main register）')
console.log(`  2. 若有页面：在 src/renderer/src/routes.ts 注册 ${pascal}Page`)
console.log('  3. npm run typecheck（含 capability-sync）')
console.log('只做界面、不需要 IPC：不要用本命令；只加 renderer 页面并改 routes.ts。')
