/**
 * Database backup minimal acceptance tests
 *
 * Verify core functions of the backup script:
 * - backup mode creates a valid sqlite file
 * - Validate file existence and basic integrity
 *
 * @requires scripts/db/backup-cli.mjs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'path';
import { beforeEach, afterEach, test, expect } from 'vitest';

// Test configuration
const TEST_DATA_DIR = './test-data';
const TEST_BACKUP_DIR = './test-backups';
const TEST_DB_PATH = path.join(TEST_DATA_DIR, 'test-app.db');

/**
 * Check if the SQLite3 CLI tool is available
 */
function isSQLite3Available(): boolean {
  try {
    execSync('sqlite3 --version', { stdio: 'pipe', encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a simple test database file
 */
function createMockDatabase(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create a simple file with a SQLite header
  const sqliteHeader = Buffer.from([
    // SQLite file format header
    0x53,
    0x51,
    0x4c,
    0x69,
    0x74,
    0x65,
    0x20,
    0x66, // "SQLite f"
    0x6f,
    0x72,
    0x6d,
    0x61,
    0x74,
    0x20,
    0x33,
    0x00, // "ormat 3\0"
  ]);

  // Pad to minimum SQLite file size (typically 1024 bytes)
  const padding = Buffer.alloc(1024 - sqliteHeader.length, 0);
  const mockDb = Buffer.concat([sqliteHeader, padding]);

  fs.writeFileSync(dbPath, mockDb);
}

/**
 * Clean up test files
 */
function cleanupTestFiles() {
  [TEST_DATA_DIR, TEST_BACKUP_DIR, './backups'].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

beforeEach(() => {
  cleanupTestFiles();
  if (isSQLite3Available()) {
    createMockDatabase(TEST_DB_PATH);
  }
});

afterEach(() => {
  cleanupTestFiles();
});

test.skipIf(!isSQLite3Available())('backup creates a valid sqlite file', () => {
  execSync(
    `node scripts/db/backup-cli.mjs ${TEST_DB_PATH} ${TEST_BACKUP_DIR} --mode=backup`,
    { stdio: 'inherit', timeout: 30000 } // Database operation 30s timeout
  );
  const latest = fs
    .readdirSync(TEST_BACKUP_DIR)
    .filter(f => f.endsWith('.sqlite'))
    .sort()
    .pop();
  expect(latest).toBeTruthy();
  // Simple check: file exists and size > 0
  const stat = fs.statSync(`${TEST_BACKUP_DIR}/${latest}`);
  expect(stat.size).toBeGreaterThan(0);
});

test.skipIf(!isSQLite3Available())(
  'VACUUM INTO mode creates compressed backup',
  () => {
    // Test VACUUM INTO mode (suitable for cold backup/light write window)
    execSync(
      `node scripts/db/backup-cli.mjs ${TEST_DB_PATH} ${TEST_BACKUP_DIR} --mode=vacuum`,
      { stdio: 'inherit', timeout: 45000 } // VACUUM is slower, 45s timeout
    );
    const latest = fs
      .readdirSync(TEST_BACKUP_DIR)
      .filter(f => f.endsWith('.sqlite'))
      .sort()
      .pop();
    expect(latest).toBeTruthy();

    // File from VACUUM INTO should be compact, without history
    const backupPath = path.join(TEST_BACKUP_DIR, latest!);
    expect(fs.existsSync(backupPath)).toBe(true);

    // Validate file size is reasonable
    const stat = fs.statSync(backupPath);
    expect(stat.size).toBeGreaterThan(0);
    expect(stat.size).toBeLessThanOrEqual(2048); // Should be compact after VACUUM
  }
);

test.skipIf(!isSQLite3Available())(
  'backup handles concurrent access gracefully',
  async () => {
    // Use async function to support await Promise.all
    // Simulate concurrent access scenario
    const promises = [] as Array<Promise<void>>;

    // Start multiple concurrent backup operations
    for (let i = 0; i < 3; i++) {
      const concurrentBackupDir = `${TEST_BACKUP_DIR}-${i}`;
      promises.push(
        new Promise<void>((resolve, reject) => {
          try {
            execSync(
              `node scripts/db/backup-cli.mjs ${TEST_DB_PATH} ${concurrentBackupDir} --mode=backup`,
              { stdio: 'pipe', timeout: 15000 } // Single concurrent operation 15s timeout
            );
            resolve();
          } catch (error) {
            reject(error as Error);
          }
        })
      );
    }

    // All backup operations should complete successfully; set overall timeout
    await Promise.all(promises);
  },
  60000 // Concurrent test 60s timeout
);

test.skipIf(!isSQLite3Available())(
  'checkpoint integration with backup workflow',
  () => {
    // Test integrated workflow of checkpoint + backup

    // 1. Perform checkpoint operation
    const checkpointResult = execSync(
      `node scripts/db/checkpoint.mjs --database=${TEST_DB_PATH} --truncate --verbose`,
      { encoding: 'utf8', stdio: 'pipe' }
    );

    const checkpointData = JSON.parse(checkpointResult);
    expect(checkpointData.ok).toBe(true);

    // 2. Immediately perform backup operation (cold window)
    execSync(
      `node scripts/db/backup-cli.mjs ${TEST_DB_PATH} ${TEST_BACKUP_DIR} --mode=vacuum`,
      { stdio: 'inherit', timeout: 45000 } // Integrated workflow 45s timeout
    );

    // 3. Verify backup file generated
    const backups = fs
      .readdirSync(TEST_BACKUP_DIR)
      .filter(f => f.endsWith('.sqlite'));
    expect(backups.length).toBeGreaterThan(0);

    // 4. Verify backup file integrity (simple check)
    const latestBackup = backups.sort().pop()!;
    const backupPath = path.join(TEST_BACKUP_DIR, latestBackup);
    const backupContent = fs.readFileSync(backupPath);

    // Check SQLite file header
    const expectedHeader = Buffer.from('SQLite format 3');
    expect(backupContent.subarray(0, expectedHeader.length)).toEqual(
      expectedHeader
    );
  }
);

test.skipIf(!isSQLite3Available())(
  'backup error handling and validation',
  () => {
    // Test error handling and validation mechanisms

    // 1. Non-existent database file
    const nonExistentDb = './non-existent-db.sqlite';
    expect(() => {
      execSync(
        `node scripts/db/backup-cli.mjs ${nonExistentDb} ${TEST_BACKUP_DIR} --mode=backup`,
        { stdio: 'pipe' }
      );
    }).toThrow();

    // 2. Invalid backup directory (read-only filesystem)
    // Note: On Windows this test may need adjustment
    if (process.platform !== 'win32') {
      const readOnlyDir = './readonly-backup';
      fs.mkdirSync(readOnlyDir, { mode: 0o444 });

      expect(() => {
        execSync(
          `node scripts/db/backup-cli.mjs ${TEST_DB_PATH} ${readOnlyDir} --mode=backup`,
          { stdio: 'pipe' }
        );
      }).toThrow();

      // Cleanup
      fs.chmodSync(readOnlyDir, 0o755);
      fs.rmSync(readOnlyDir, { recursive: true, force: true });
    }
  }
);

test.skipIf(!isSQLite3Available())('backup script JSON output format', () => {
  // Test JSON output format of the backup script (for CI integration)
  const result = execSync(
    `node scripts/db/backup-cli.mjs ${TEST_DB_PATH} ${TEST_BACKUP_DIR} --mode=backup --json`,
    { encoding: 'utf8', stdio: 'pipe' }
  );

  const jsonOutput = JSON.parse(result);
  expect(jsonOutput.ok).toBe(true);
  expect(jsonOutput.backupFile).toBeDefined();
  expect(jsonOutput.mode).toBe('backup');
  expect(jsonOutput.timestamp).toBeDefined();
  expect(jsonOutput.databaseSize).toBeGreaterThan(0);
  expect(jsonOutput.backupSize).toBeGreaterThan(0);
});
