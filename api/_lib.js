import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'))

const startedAt = Date.now()

export function getInfo() {
  return {
    name: pkg.name,
    version: pkg.version,
    status: 'ok',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    commitShort: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    environment: process.env.VERCEL_ENV ?? 'development',
    region: process.env.VERCEL_REGION ?? null,
    node: process.version,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  }
}
