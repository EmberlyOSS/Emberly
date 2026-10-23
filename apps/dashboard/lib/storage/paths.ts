import { join, resolve } from 'node:path'

export function dataRoot() {
  return resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || process.cwd())
}

export function dataPath(...parts: string[]) {
  return join(/*turbopackIgnore: true*/ dataRoot(), ...parts)
}
