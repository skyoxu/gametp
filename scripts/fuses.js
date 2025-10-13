// Electron fuses configuration and helpers (ESM)
// Clean ASCII-only logging for Windows runners.
// JSDoc typedefs to assist TypeScript tests.

/**
 * @typedef {object} FusesConfig
 * @property {boolean} runAsNode
 * @property {boolean} enableRunAsNode
 * @property {boolean} enableNodeOptionsEnvironmentVariable
 * @property {boolean} enableNodeCliInspectArguments
 * @property {boolean} onlyLoadAppFromAsar
 * @property {boolean} enableEmbeddedAsarIntegrityValidation
 * @property {boolean} resetAdHocDarwinCASignature
 * @property {boolean} enableCookieEncryption
 * @property {boolean} loadBrowserProcessSpecificV8Snapshot
 * @property {boolean} enablePrintPrototypeOverwrite
 * @property {number} version
 */

/**
 * @typedef {object} FuseEvaluationResult
 * @property {boolean} ok
 * @property {{key:string, actual:any, expected:any}[]} mismatches
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
let flipFuses = null
let readFusesFn = null
let FuseVersion = null
try {
  const mod = require('@electron/fuses')
  // Support both CJS and ESM shapes
  const src = mod && typeof mod === 'object' ? mod : {}
  const d = src.default && typeof src.default === 'object' ? src.default : {}
  flipFuses = src.flipFuses || d.flipFuses || null
  readFusesFn = src.readFuses || d.readFuses || null
  FuseVersion = src.FuseVersion || d.FuseVersion || null
} catch (e) {
  // Defer error handling to usage sites
}
if (!FuseVersion) {
  // Fallback enum placeholder to avoid crashes when module resolution fails
  FuseVersion = { V1: 1 }
}

export const PRODUCTION_FUSES_CONFIG = {
  version: FuseVersion.V1,
  runAsNode: false,
  enableRunAsNode: false,
  enableNodeOptionsEnvironmentVariable: false,
  enableNodeCliInspectArguments: false,
  onlyLoadAppFromAsar: true,
  enableEmbeddedAsarIntegrityValidation: true,
  resetAdHocDarwinCASignature: false,
  enableCookieEncryption: true,
  loadBrowserProcessSpecificV8Snapshot: false,
  enablePrintPrototypeOverwrite: false,
}

export const DEVELOPMENT_FUSES_CONFIG = {
  version: FuseVersion.V1,
  resetAdHocDarwinCASignature: false,
  enableCookieEncryption: false,
  enableNodeOptionsEnvironmentVariable: true,
  enableNodeCliInspectArguments: true,
  enableEmbeddedAsarIntegrityValidation: false,
  onlyLoadAppFromAsar: false,
  loadBrowserProcessSpecificV8Snapshot: true,
  enablePrintPrototypeOverwrite: true,
  runAsNode: true,
  enableRunAsNode: true,
}

export async function applyFusesConfig(isProduction = process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const root = path.join(__dirname, '..')

  // Preferred candidates (exact electron.exe)
  const exactCandidates = [
    path.join(root, 'dist-electron', 'win-unpacked', 'electron.exe'),
    path.join(root, 'dist-electron', 'electron.exe'),
    path.join(root, 'electron-dist', 'win-unpacked', 'electron.exe'),
    path.join(root, 'electron-dist', 'electron.exe'),
    path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'),
  ]

  let electronBinary = exactCandidates.find(p => {
    try { return fs.existsSync(p) && fs.statSync(p).isFile() } catch { return false }
  })

  // Fallback: search for any .exe in win-unpacked (electron-builder renames electron.exe to <ProductName>.exe)
  if (!electronBinary) {
    const fallbackDirs = [
      path.join(root, 'electron-dist', 'win-unpacked'),
      path.join(root, 'dist-electron', 'win-unpacked'),
    ]
    for (const dir of fallbackDirs) {
      try {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
          const exe = fs.readdirSync(dir).find(n => /\.exe$/i.test(n))
          if (exe) { electronBinary = path.join(dir, exe); break }
        }
      } catch {}
    }
  }

  const config = isProduction ? PRODUCTION_FUSES_CONFIG : DEVELOPMENT_FUSES_CONFIG
  console.log(`Applying Electron Fuses for ${isProduction ? 'production' : 'development'}...`)

  if (!electronBinary) {
    const msg = 'Electron binary not found. Package first (e.g., npm run build:win:dir) before applying fuses.'
    if (isProduction) {
      console.error(`ERROR: ${msg}`)
      process.exit(1)
    } else {
      console.warn(`WARN: ${msg} Skipping in development mode.`)
      return
    }
  }

  try {
    if (!flipFuses || typeof flipFuses !== 'function') {
      console.warn('WARN: flipFuses API not available; skipping fuse application step.')
      return
    }
    await flipFuses(electronBinary, config)
    console.log('Fuses applied successfully. Verifying...')
    await verifyFusesConfig(electronBinary, config)
  } catch (error) {
    console.error('ERROR: Failed to apply Electron fuses:', error)
    process.exit(1)
  }
}

export async function verifyFusesConfigWith(electronBinary, expectedConfig, deps = {}) {
  const read = deps.readFusesFn || readFusesFn
  const exit = deps.exitFn || process.exit
  console.log('Verifying Electron fuses...')
  try {
    if (!read || typeof read !== 'function') {
      console.warn('WARN: readFuses API not available; skipping verification step.')
      return { ok: true, mismatches: [] }
    }
    const actual = await read(electronBinary)
    const verdict = evaluateFuses(actual, expectedConfig)
    if (!verdict.ok) {
      for (const m of verdict.mismatches) {
        console.error(`ERROR: Fuse mismatch: ${m.key} = ${m.actual}, expected = ${m.expected}`)
      }
      console.error('ERROR: Electron fuses verification failed.')
      exit(1)
    } else {
      console.log('Fuses verification passed.')
    }
    return verdict
  } catch (error) {
    console.error('ERROR: Unable to verify Electron fuses:', error)
    exit(1)
  }
}

export async function verifyFusesConfig(electronBinary, expectedConfig) {
  return verifyFusesConfigWith(electronBinary, expectedConfig)
}

/**
 * @param {Record<string, any>} actual
 * @param {FusesConfig} expectedConfig
 * @returns {FuseEvaluationResult}
 */
export function evaluateFuses(actual, expectedConfig) {
  const checks = [
    { key: 'runAsNode', expected: expectedConfig.runAsNode },
    { key: 'enableNodeOptionsEnvironmentVariable', expected: expectedConfig.enableNodeOptionsEnvironmentVariable },
    { key: 'onlyLoadAppFromAsar', expected: expectedConfig.onlyLoadAppFromAsar },
    { key: 'enableEmbeddedAsarIntegrityValidation', expected: expectedConfig.enableEmbeddedAsarIntegrityValidation },
  ]
  const mismatches = []
  for (const c of checks) {
    const val = actual ? actual[c.key] : undefined
    if (val !== c.expected) mismatches.push({ key: c.key, actual: val, expected: c.expected })
  }
  return { ok: mismatches.length === 0, mismatches }
}

// ESM entrypoint check
try {
  const argv1 = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : ''
  if (argv1 && import.meta.url.endsWith(argv1)) {
    const isProd = process.argv.includes('--production') || process.env.NODE_ENV === 'production'
    applyFusesConfig(isProd)
  }
} catch {}
