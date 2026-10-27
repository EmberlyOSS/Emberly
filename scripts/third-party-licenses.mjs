#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]])
    return pairs
  }, [])
)

if (!args.package || !args.out) {
  console.error(
    'Usage: --package <package.json> --out <file> [--cargo <Cargo.toml>] [--name <product>]'
  )
  process.exit(1)
}

const LICENSE_FILE = /^(licen[cs]e|copying|notice|unlicense)([-._].*)?$/i

function licenseTexts(dir) {
  let names = []
  try {
    names = readdirSync(dir)
      .filter((name) => LICENSE_FILE.test(name))
      .sort()
  } catch {}
  return names
    .map((name) => {
      try {
        return readFileSync(join(dir, name), 'utf8').trim()
      } catch {
        return ''
      }
    })
    .filter(Boolean)
}

function licenseOf(pkg) {
  if (typeof pkg.license === 'string') return pkg.license
  if (pkg.license?.type) return pkg.license.type
  if (Array.isArray(pkg.licenses))
    return pkg.licenses.map((l) => l.type ?? l).join(' OR ')
  return 'UNKNOWN'
}

function repositoryOf(pkg) {
  const repo =
    typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  return (repo || pkg.homepage || '')
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://')
}

function findPackageDir(name, fromDir) {
  let dir = fromDir
  while (true) {
    if (parse(dir).base !== 'node_modules') {
      const candidate = join(dir, 'node_modules', name, 'package.json')
      if (existsSync(candidate)) return realpathSync(dirname(candidate))
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function npmEntries(packageJsonPath) {
  const rootDir = realpathSync(dirname(resolve(packageJsonPath)))
  const entries = new Map()
  const visited = new Set()
  const queue = [rootDir]

  while (queue.length) {
    const dir = queue.shift()
    if (visited.has(dir)) continue
    visited.add(dir)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const isThirdParty = dir.split(/[\\/]/).includes('node_modules')
    if (isThirdParty && !pkg.private) {
      const key = `${pkg.name}@${pkg.version}`
      if (!entries.has(key)) {
        entries.set(key, {
          name: pkg.name,
          version: pkg.version,
          license: licenseOf(pkg),
          repository: repositoryOf(pkg),
          texts: licenseTexts(dir),
        })
      }
    }

    const deps = {
      ...pkg.dependencies,
      ...pkg.optionalDependencies,
      ...(isThirdParty ? pkg.peerDependencies : {}),
    }
    for (const name of Object.keys(deps)) {
      const found = findPackageDir(name, dir)
      if (found && !visited.has(found)) queue.push(found)
    }
  }
  return [...entries.values()]
}

function cargoEntries(manifestPath) {
  const metadata = JSON.parse(
    execFileSync(
      'cargo',
      [
        'metadata',
        '--format-version',
        '1',
        '--manifest-path',
        resolve(manifestPath),
      ],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
    )
  )
  const packages = new Map(metadata.packages.map((p) => [p.id, p]))
  const nodes = new Map(metadata.resolve.nodes.map((n) => [n.id, n]))
  const root = metadata.resolve.root
  const shipped = new Set()
  const queue = [root]

  while (queue.length) {
    const id = queue.shift()
    if (shipped.has(id)) continue
    shipped.add(id)
    for (const dep of nodes.get(id)?.deps ?? []) {
      if (dep.dep_kinds.some((k) => k.kind === null)) queue.push(dep.pkg)
    }
  }
  shipped.delete(root)

  return [...shipped]
    .map((id) => packages.get(id))
    .filter((p) => p && p.source)
    .map((p) => ({
      name: p.name,
      version: p.version,
      license: p.license || (p.license_file ? 'See license file' : 'UNKNOWN'),
      repository: p.repository || p.homepage || '',
      texts: licenseTexts(dirname(p.manifest_path)),
    }))
}

const entries = [
  ...npmEntries(args.package),
  ...(args.cargo ? cargoEntries(args.cargo) : []),
].sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
)

const product = args.name || 'This software'
const rule = '='.repeat(78)
const out = [
  'THIRD-PARTY SOFTWARE LICENSES',
  '',
  `${product} includes the open-source packages listed below. Each is used under`,
  'its own license, reproduced here as published by its authors.',
  '',
  `Packages: ${entries.length}`,
  '',
]

// Many packages share a license word for word, so each text is printed once with every package that uses it
const groups = new Map()
for (const entry of entries) {
  const text = entry.texts.length
    ? entry.texts.join(`\n\n${'-'.repeat(40)}\n\n`)
    : `(These packages don't include a license file. They are published under ${entry.license}.)`
  if (!groups.has(text)) groups.set(text, [])
  groups.get(text).push(entry)
}

for (const [text, users] of groups) {
  out.push(rule)
  for (const entry of users) {
    out.push(
      `${entry.name} ${entry.version} (${entry.license})${entry.repository ? ` ${entry.repository}` : ''}`
    )
  }
  out.push('', text, '')
}

writeFileSync(args.out, out.join('\n'))
console.log(`Wrote ${entries.length} package licenses to ${args.out}`)
