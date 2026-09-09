import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { err, ok, type Result } from '@shared/kernel/result'
import { dataRoot } from '../env'

const capabilityNamePattern = /^[a-z][a-z0-9-]*$/
const fileNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/

function resolveCapabilityFile(capability: string, file: string): Result<string> {
  if (!capabilityNamePattern.test(capability)) {
    return err('storage.invalid-capability', '能力包名称不合法')
  }

  if (!fileNamePattern.test(file) || file !== basename(file)) {
    return err('storage.invalid-file', '存储文件名不合法')
  }

  return ok(join(dataRoot, 'capabilities', capability, file))
}

export function readJson<T>(capability: string, file: string): Result<T> {
  const pathResult = resolveCapabilityFile(capability, file)
  if (!pathResult.ok) {
    return pathResult
  }

  try {
    const text = readFileSync(pathResult.value, 'utf8')
    return ok(JSON.parse(text) as T)
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取失败'
    return err('storage.read-failed', message)
  }
}

export function writeJson(capability: string, file: string, value: unknown): Result<undefined> {
  const pathResult = resolveCapabilityFile(capability, file)
  if (!pathResult.ok) {
    return pathResult
  }

  try {
    mkdirSync(join(dataRoot, 'capabilities', capability), { recursive: true })
    writeFileSync(pathResult.value, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    return ok(undefined)
  } catch (error) {
    const message = error instanceof Error ? error.message : '写入失败'
    return err('storage.write-failed', message)
  }
}
