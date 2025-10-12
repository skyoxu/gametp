// Electron Fuses configuration and application helpers
// Clean ASCII-only output to avoid encoding issues on Windows runners.

const fs = require('fs');
const path = require('path');
const { flipFuses, readFuses, FuseVersion } = require('@electron/fuses');

// Production hardening: least-privilege defaults
const PRODUCTION_FUSES_CONFIG = {
  version: FuseVersion.V1,
  // Entry-point hardening
  runAsNode: false,
  enableRunAsNode: false,
  enableNodeOptionsEnvironmentVariable: false,
  enableNodeCliInspectArguments: false,
  // Integrity and ASAR
  onlyLoadAppFromAsar: true,
  enableEmbeddedAsarIntegrityValidation: true,
  // Additional hardening
  resetAdHocDarwinCASignature: false,
  enableCookieEncryption: true,
  loadBrowserProcessSpecificV8Snapshot: false,
  enablePrintPrototypeOverwrite: false,
};

// Development: relaxed for local debugging
const DEVELOPMENT_FUSES_CONFIG = {
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
};

// Apply fuses to a real Electron binary
async function applyFusesConfig(
  isProduction = process.env.NODE_ENV === 'production'
) {
  const root = path.join(__dirname, '..');
  const candidates = [
    // Windows-only
    path.join(root, 'dist-electron', 'win-unpacked', 'electron.exe'),
    path.join(root, 'dist-electron', 'electron.exe'),
    // Local dev binary
    path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'),
  ];

  const electronBinary = candidates.find(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });

  const config = isProduction
    ? PRODUCTION_FUSES_CONFIG
    : DEVELOPMENT_FUSES_CONFIG;
  console.log(
    `Applying Electron Fuses for ${isProduction ? 'production' : 'development'}...`
  );

  if (!electronBinary) {
    const msg =
      'Electron binary not found. Package first (e.g., npm run build:win:dir) before applying fuses.';
    if (isProduction) {
      console.error(`ERROR: ${msg}`);
      process.exit(1);
    } else {
      console.warn(`WARN: ${msg} Skipping in development mode.`);
      return;
    }
  }

  try {
    await flipFuses(electronBinary, config);
    console.log('Fuses applied successfully. Verifying...');
    await verifyFusesConfig(electronBinary, config);
  } catch (error) {
    console.error('ERROR: Failed to apply Electron fuses:', error);
    process.exit(1);
  }
}

// Verify the applied fuses match expectations (DI-friendly)
async function verifyFusesConfigWith(
  electronBinary,
  expectedConfig,
  deps = {}
) {
  const read = deps.readFusesFn || readFuses;
  const exit = deps.exitFn || process.exit;
  console.log('Verifying Electron fuses...');
  try {
    const actual = await read(electronBinary);
    const verdict = evaluateFuses(actual, expectedConfig);
    if (!verdict.ok) {
      for (const m of verdict.mismatches) {
        console.error(
          `ERROR: Fuse mismatch: ${m.key} = ${m.actual}, expected = ${m.expected}`
        );
      }
      console.error('ERROR: Electron fuses verification failed.');
      exit(1);
    } else {
      console.log('Fuses verification passed.');
    }
    return verdict;
  } catch (error) {
    console.error('ERROR: Unable to verify Electron fuses:', error);
    exit(1);
  }
}

async function verifyFusesConfig(electronBinary, expectedConfig) {
  return verifyFusesConfigWith(electronBinary, expectedConfig);
}

// Pure function to evaluate fuses without I/O or exits
function evaluateFuses(actual, expectedConfig) {
  const checks = [
    { key: 'runAsNode', expected: expectedConfig.runAsNode },
    {
      key: 'enableNodeOptionsEnvironmentVariable',
      expected: expectedConfig.enableNodeOptionsEnvironmentVariable,
    },
    {
      key: 'onlyLoadAppFromAsar',
      expected: expectedConfig.onlyLoadAppFromAsar,
    },
    {
      key: 'enableEmbeddedAsarIntegrityValidation',
      expected: expectedConfig.enableEmbeddedAsarIntegrityValidation,
    },
  ];
  const mismatches = [];
  for (const c of checks) {
    const val = actual ? actual[c.key] : undefined;
    if (val !== c.expected) {
      mismatches.push({ key: c.key, actual: val, expected: c.expected });
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

if (require.main === module) {
  const isProduction =
    process.argv.includes('--production') ||
    process.env.NODE_ENV === 'production';
  applyFusesConfig(isProduction);
}

module.exports = {
  PRODUCTION_FUSES_CONFIG,
  DEVELOPMENT_FUSES_CONFIG,
  applyFusesConfig,
  verifyFusesConfig,
  verifyFusesConfigWith,
  evaluateFuses,
};
