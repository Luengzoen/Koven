import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const softLimit = 300
const hardLimit = 500
const countedExts = new Set(['.ts', '.tsx', '.css', '.js', '.mjs'])
const skipDirNames = new Set(['node_modules', 'out', 'dist', '.git'])

/** 例外必须点名。相对仓库根，一律正斜杠。 */
const allowlist = new Set([])

function toPosix(filePath) {
  return filePath.split('\\').join('/')
}

function walkFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipDirNames.has(entry.name)) {
      continue
    }

    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, found)
      continue
    }

    if (entry.isFile() && countedExts.has(extname(entry.name))) {
      found.push(fullPath)
    }
  }

  return found
}

function countLines(filePath) {
  const text = readFileSync(filePath, 'utf8')
  if (text.length === 0) {
    return 0
  }
  return text.split(/\r?\n/).length
}

const roots = [join(projectRoot, 'src'), join(projectRoot, 'scripts')]
const files = roots.flatMap((dir) => {
  try {
    return statSync(dir).isDirectory() ? walkFiles(dir) : []
  } catch {
    return []
  }
})

const warnings = []
const violations = []

for (const filePath of files) {
  const rel = toPosix(relative(projectRoot, filePath))
  if (allowlist.has(rel)) {
    continue
  }

  const lines = countLines(filePath)
  if (lines > hardLimit) {
    violations.push({ rel, lines })
    continue
  }
  if (lines > softLimit) {
    warnings.push({ rel, lines })
  }
}

if (warnings.length > 0) {
  console.warn(`文件行数超过软门槛 ${softLimit}（继续涨须先提出拆分）：`)
  for (const item of warnings) {
    console.warn(`  ${item.rel}  ${item.lines}`)
  }
}

if (violations.length > 0) {
  console.error(`文件行数超过硬门槛 ${hardLimit}：`)
  for (const item of violations) {
    console.error(`  ${item.rel}  ${item.lines}`)
  }
  process.exit(1)
}

console.log(
  `文件预算通过：检查 ${files.length} 个文件，硬门槛 ${hardLimit}，软门槛 ${softLimit}。`
)
