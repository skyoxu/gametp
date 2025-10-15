import fs from 'node:fs'
import path from 'node:path'

function log(msg) {
  console.log(`[prune-pack-deps] ${msg}`)
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8')
}

function ensureLogDir() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const dir = path.join('logs', `${yyyy}-${mm}-${dd}`, 'ci')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function main() {
  const cwd = process.cwd()
  const pkgPath = path.join(cwd, 'package.json')
  const pkg = readJson(pkgPath)

  const candidates = new Set([
    '@zilliz/claude-context-mcp',
    '@upstash/context7-mcp',
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-sequential-thinking',
    '@kazuph/mcp-fetch',
    'ai-sdk-provider-gemini-cli',
    '@brave/brave-search-mcp-server',
  ])

  const moved = []
  pkg.devDependencies = pkg.devDependencies || {}
  const deps = pkg.dependencies || {}
  for (const name of Object.keys(deps)) {
    if (candidates.has(name) || /mcp/i.test(name) || /modelcontextprotocol/i.test(name)) {
      pkg.devDependencies[name] = deps[name]
      delete deps[name]
      moved.push(name)
    }
  }
  pkg.dependencies = deps

  writeJson(pkgPath, pkg)

  const dir = ensureLogDir()
  const logPath = path.join(dir, 'prune-pack-deps.log')
  fs.writeFileSync(
    logPath,
    `moved to devDependencies: ${moved.join(', ')}`,
    'utf-8'
  )
  log(`moved packages: ${moved.length}`)
}

main()

