#!/usr/bin/env node
// Puts Emberly's license, the third-party notices and the generated package list where /licenses can serve them.
// Runs before every dashboard build.

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dashboard = join(root, 'apps', 'dashboard')
const out = join(dashboard, 'public', 'licenses')

mkdirSync(out, { recursive: true })
copyFileSync(join(root, 'LICENSE'), join(out, 'LICENSE.txt'))
copyFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), join(out, 'NOTICES.md'))
execFileSync(
  process.execPath,
  [
    join(root, 'scripts', 'third-party-licenses.mjs'),
    '--package',
    join(dashboard, 'package.json'),
    '--out',
    join(out, 'packages.txt'),
    '--name',
    'Emberly',
  ],
  { stdio: 'inherit' }
)
