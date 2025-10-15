import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Returns the Electron main process entry path (absolute path).
 * Priority order:
 * 1) ELECTRON_MAIN_PATH if set AND exists
 * 2) dist-electron/electron/main.js
 * 3) dist-electron/main.js
 * 4) electron/main.js
 */
export function getElectronEntry(): string {
  const cwd = process.cwd();
  const hinted = process.env.ELECTRON_MAIN_PATH;
  const candidates: string[] = [];
  if (hinted && hinted.trim().length > 0) {
    candidates.push(resolve(cwd, hinted));
  }
  candidates.push(
    resolve(cwd, 'dist-electron', 'electron', 'main.js'),
    resolve(cwd, 'dist-electron', 'main.js'),
    resolve(cwd, 'electron', 'main.js')
  );
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // Return first candidate for helpful error context
  return candidates[0] || resolve(cwd, 'dist-electron', 'electron', 'main.js');
}

/**
 * Asserts that the entry path exists; throws error if not, prompting to build first or configure environment variable correctly.
 */
export function assertElectronEntry(): string {
  const entry = getElectronEntry();
  if (!existsSync(entry)) {
    throw new Error(
      `Electron entry not found: ${entry}. Please run "npm run build" first or set ELECTRON_MAIN_PATH to a valid path (e.g. dist-electron/electron/main.js).`
    );
  }
  return entry;
}

