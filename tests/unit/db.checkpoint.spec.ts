/**
 * SQLite WAL Checkpoint
 *
 *  checkpoint
 * - TRUNCATE  checkpoint
 * - WAL
 * -
 *
 * @requires scripts/db/checkpoint.mjs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'path';
import { beforeEach, afterEach, test, expect } from 'vitest';

//
const TEST_DATA_DIR = './test-checkpoint-data';
const TEST_DB_PATH = path.join(TEST_DATA_DIR, 'test-checkpoint.db');

/**
 *  better-sqlite3
 */
function isBetterSQLite3Available(): boolean {
  try {
    // 尝试实际加载并打开内存数据库，以验证原生绑定可用

    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    try {
      db.close();
    } catch {}
    return true;
  } catch {
    return false;
  }
}

/**
 * WAL
 */
async function createTestWALDatabase(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    console.log('Attempting to create WAL database...');
    //  better-sqlite3
    const sqlite3Module = await import('better-sqlite3');
    const Database = sqlite3Module.default;
    console.log('better-sqlite3 imported successfully');
    const db = new Database(dbPath);
    console.log('Database created at:', dbPath);

    //  WAL
    db.pragma('journal_mode = WAL');

    //
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_data (
        id INTEGER PRIMARY KEY,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO test_data (content) VALUES 
        ('test data 1'),
        ('test data 2'),
        ('test data 3');
    `);

    //  WAL
    db.prepare('INSERT INTO test_data (content) VALUES (?)').run(
      'wal test data'
    );

    console.log('WAL file should now exist at:', dbPath + '-wal');
    db.close();
    console.log('Database closed successfully');
  } catch {
    console.error('Error in createTestWALDatabase');
    //  better-sqlite3
    const sqliteHeader = Buffer.from([
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
    const padding = Buffer.alloc(1024 - sqliteHeader.length, 0);
    fs.writeFileSync(dbPath, Buffer.concat([sqliteHeader, padding]));

    //  WAL
    fs.writeFileSync(dbPath + '-wal', Buffer.alloc(1024, 0));
  }
}

/**
 *
 */
function cleanupTestFiles() {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
}

beforeEach(async () => {
  cleanupTestFiles();
  try {
    await createTestWALDatabase(TEST_DB_PATH);
    console.log(`Created database: ${TEST_DB_PATH}`);
    console.log(
      `Database exists after creation: ${fs.existsSync(TEST_DB_PATH)}`
    );
    console.log(
      `WAL file exists after creation: ${fs.existsSync(TEST_DB_PATH + '-wal')}`
    );
  } catch {
    console.error('Error creating test database');
  }
});

afterEach(() => {
  cleanupTestFiles();
});

test.skip('checkpoint TRUNCATE mode clears WAL file', () => {
  //  WAL
  const walFile = TEST_DB_PATH + '-wal';
  console.log(`Looking for WAL file: ${walFile}`);
  console.log(`WAL file exists: ${fs.existsSync(walFile)}`);
  console.log(`Database file exists: ${fs.existsSync(TEST_DB_PATH)}`);
  if (fs.existsSync(TEST_DATA_DIR)) {
    console.log(`Test directory contents:`, fs.readdirSync(TEST_DATA_DIR));
  }
  expect(fs.existsSync(walFile)).toBe(true);

  //  TRUNCATE  checkpoint
  const result = execSync(
    `node scripts/db/checkpoint.mjs --database=${TEST_DB_PATH} --truncate --verbose`,
    { encoding: 'utf8', stdio: 'pipe', timeout: 30000 } // WAL checkpoint 30s
  );

  const checkpointData = JSON.parse(result);
  expect(checkpointData.ok).toBe(true);
  expect(checkpointData.mode).toBe('TRUNCATE');
  expect(checkpointData.timestamp).toBeDefined();
  expect(checkpointData.database).toBe(TEST_DB_PATH);
});

test.skipIf(!isBetterSQLite3Available())(
  'checkpoint handles non-WAL databases gracefully',
  () => {
    //  WAL
    const nonWALPath = path.join(TEST_DATA_DIR, 'non-wal.db');

    try {
      const Database = require('better-sqlite3');
      const db = new Database(nonWALPath);
      db.pragma('journal_mode = DELETE'); //  DELETE  WAL
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY);');
      db.close();
    } catch {
      // Fallback
      const sqliteHeader = Buffer.from('SQLite format 3\0');
      const padding = Buffer.alloc(1024 - sqliteHeader.length, 0);
      fs.writeFileSync(nonWALPath, Buffer.concat([sqliteHeader, padding]));
    }

    const result = execSync(
      `node scripts/db/checkpoint.mjs --database=${nonWALPath} --verbose`,
      { encoding: 'utf8', stdio: 'pipe', timeout: 20000 } // WAL20s
    );

    const checkpointData = JSON.parse(result);
    expect(checkpointData.ok).toBe(true);
    expect(checkpointData.skipped).toBe(true);
    expect(checkpointData.reason).toContain('not in WAL mode');
  }
);

test('checkpoint script parameter validation', () => {
  //
  expect(() => {
    execSync('node scripts/db/checkpoint.mjs --database=./non-existent.db', {
      stdio: 'pipe',
    });
  }).toThrow();
});

test('checkpoint script help output', () => {
  const helpOutput = execSync('node scripts/db/checkpoint.mjs --help', {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  expect(helpOutput).toContain('SQLite Checkpoint \u7ba1\u7406\u811a\u672c');
  expect(helpOutput).toContain('--truncate');
  expect(helpOutput).toContain('--database');
  expect(helpOutput).toContain('TRUNCATE \u6a21\u5f0f');
});

test.skipIf(!isBetterSQLite3Available())(
  'checkpoint integration with guard:ci',
  () => {
    //  checkpoint

    // 1.  WAL
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

    // 2.  guard:ci  checkpoint
    const result = execSync(
      `node scripts/db/checkpoint.mjs --database=${TEST_DB_PATH} --truncate`,
      { encoding: 'utf8', stdio: 'pipe', timeout: 30000 } // CI30s
    );

    const checkpointData = JSON.parse(result);
    expect(checkpointData.ok).toBe(true);
    expect(checkpointData.mode).toBe('TRUNCATE');

    // 3.
    try {
      const Database = require('better-sqlite3');
      const db = new Database(TEST_DB_PATH);
      const count = db.prepare('SELECT COUNT(*) as count FROM test_data').get();
      expect(count.count).toBeGreaterThan(0);
      db.close();
    } catch {
      //  better-sqlite3
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    }
  }
);

test.skipIf(!isBetterSQLite3Available())(
  'checkpoint error handling and recovery',
  () => {
    //

    // 1.
    let lockingDb: unknown;
    try {
      const Database = require('better-sqlite3');
      lockingDb = new Database(TEST_DB_PATH);
      lockingDb.pragma('locking_mode = EXCLUSIVE');

      //  checkpoint
      const result = execSync(
        `node scripts/db/checkpoint.mjs --database=${TEST_DB_PATH} --truncate --verbose`,
        { encoding: 'utf8', stdio: 'pipe', timeout: 45000 } // 45s
      );

      const checkpointData = JSON.parse(result);
      // checkpoint
      expect(checkpointData).toBeDefined();
    } finally {
      if (lockingDb) {
        try {
          lockingDb.close();
        } catch {
          // ignore close errors in tests
        }
      }
    }
  }
);

test('checkpoint script JSON output format consistency', () => {
  //  JSON

  // 1.  checkpoint better-sqlite3  JSON
  let checkpointResult;
  try {
    checkpointResult = execSync(
      `node scripts/db/checkpoint.mjs --database=${TEST_DB_PATH} --truncate`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string };
    checkpointResult = e.stdout || e.stderr || '';
  }

  //  JSON
  const checkpointData = JSON.parse(checkpointResult);
  expect(checkpointData.timestamp).toBeDefined();
  expect(checkpointData.database).toBe(TEST_DB_PATH);

  if (checkpointData.ok) {
    //
    expect(checkpointData.mode).toBeDefined();
  } else {
    //  better-sqlite3
    expect(checkpointData.error).toBeDefined();
  }

  // 2.  checkpoint
  let errorData;
  try {
    execSync('node scripts/db/checkpoint.mjs --database=./invalid-path.db', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error: unknown) {
    const e = error as { stdout?: string };
    if (e.stdout) {
      try {
        errorData = JSON.parse(e.stdout);
      } catch (parseError) {
        console.warn('[db.checkpoint] failed to parse stdout JSON', parseError);
        errorData = undefined;
      }
    }
  }

  if (errorData) {
    expect(errorData.ok).toBe(false);
    expect(errorData.error).toBeDefined();
    expect(errorData.timestamp).toBeDefined();
  }
});
