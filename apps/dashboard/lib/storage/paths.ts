import { basename, dirname, join, resolve } from 'node:path'

function defaultRoot() {
  const cwd = process.cwd()
  const inDashboard =
    basename(cwd) === 'dashboard' && basename(dirname(cwd)) === 'apps'
  return inDashboard ? resolve(cwd, '../..') : cwd
}

export function dataRoot() {
  return resolve(
    /*turbopackIgnore: true*/ process.env.DATA_DIR || defaultRoot()
  )
}

export function dataPath(...parts: string[]) {
  return join(/*turbopackIgnore: true*/ dataRoot(), ...parts)
}
