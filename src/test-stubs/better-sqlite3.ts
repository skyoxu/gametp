// Minimal stub of better-sqlite3 for vitest environment
class DatabaseStub {
  private closed = false;
  constructor(public file: string) {}
  pragma(_sql: string, opts?: { simple?: boolean }): any {
    const sql = _sql.toLowerCase();
    if (sql.startsWith('journal_mode')) return opts?.simple ? 'wal' : ['wal'];
    if (sql.startsWith('wal_checkpoint'))
      return opts?.simple ? [0, 0, 0] : [[0, 0, 0]];
    if (sql.startsWith('cache_spill')) return -1;
    if (sql.startsWith('quick_check')) return ['ok'];
    if (sql.startsWith('foreign_key_check')) return [];
    if (sql.startsWith('page_count')) return [1000];
    if (sql.startsWith('page_size')) return [4096];
    if (sql.startsWith('freelist_count')) return [0];
    // Allow arbitrary pragma set statements like "locking_mode = EXCLUSIVE"
    return 1;
  }
  close() {
    this.closed = true;
  }
}

export default DatabaseStub;
