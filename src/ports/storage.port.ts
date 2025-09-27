/**
 *  -
 *
 */

/**
 *
 */
export interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: StorageMetadata;
}

/**
 *
 */
export interface StorageMetadata {
  size: number;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  checksum?: string;
}

/**
 *
 */
export interface StorageQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

/**
 *
 */
export interface StorageTransaction {
  readonly id: string;

  /**
   *
   */
  execute<T>(operation: (tx: StorageTransaction) => Promise<T>): Promise<T>;

  /**
   *
   */
  commit(): Promise<void>;

  /**
   *
   */
  rollback(): Promise<void>;

  /**
   *
   */
  set(key: string, value: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  get<T>(key: string): Promise<StorageResult<T>>;

  /**
   *
   */
  delete(key: string): Promise<StorageResult<void>>;
}

/**
 *
 */
export interface StoragePort {
  /**
   *
   */
  set(key: string, value: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  get<T>(key: string): Promise<StorageResult<T>>;

  /**
   *
   */
  has(key: string): Promise<boolean>;

  /**
   *
   */
  delete(key: string): Promise<StorageResult<void>>;

  /**
   *
   */
  clear(): Promise<StorageResult<void>>;

  /**
   *
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   *
   */
  getStats(): Promise<StorageStats>;

  /**
   *
   */
  compact(): Promise<StorageResult<void>>;

  /**
   *
   */
  transaction(): Promise<StorageTransaction>;

  /**
   *
   */
  batch(operations: StorageOperation[]): Promise<StorageResult<unknown>[]>;
}

/**
 *
 */
export interface QueryableStoragePort extends StoragePort {
  /**
   *
   */
  query<T>(
    collection: string,
    options?: StorageQueryOptions
  ): Promise<StorageResult<T[]>>;

  /**
   *
   */
  createIndex(
    collection: string,
    field: string,
    options?: IndexOptions
  ): Promise<StorageResult<void>>;

  /**
   *
   */
  dropIndex(
    collection: string,
    indexName: string
  ): Promise<StorageResult<void>>;

  /**
   *
   */
  insert<T>(collection: string, document: T): Promise<StorageResult<string>>;

  /**
   *
   */
  update<T>(
    collection: string,
    id: string,
    document: Partial<T>
  ): Promise<StorageResult<void>>;

  /**
   *
   */
  remove(collection: string, id: string): Promise<StorageResult<void>>;

  /**
   *
   */
  findById<T>(collection: string, id: string): Promise<StorageResult<T>>;

  /**
   *
   */
  find<T>(
    collection: string,
    query: QueryFilter,
    options?: StorageQueryOptions
  ): Promise<StorageResult<T[]>>;

  /**
   *
   */
  count(
    collection: string,
    query?: QueryFilter
  ): Promise<StorageResult<number>>;
}

/**
 *
 */
export interface CacheStoragePort {
  /**
   * (TTL)
   */
  setCache(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<StorageResult<void>>;

  /**
   *
   */
  getCache<T>(key: string): Promise<StorageResult<T>>;

  /**
   *
   */
  deleteCache(key: string): Promise<StorageResult<void>>;

  /**
   * TTL
   */
  refreshCache(key: string, ttlSeconds: number): Promise<StorageResult<void>>;

  /**
   *
   */
  clearCache(): Promise<StorageResult<void>>;

  /**
   *
   */
  getCacheStats(): Promise<CacheStats>;
}

/**
 *
 */
export interface BackupStoragePort {
  /**
   *
   */
  createBackup(backupId: string): Promise<StorageResult<BackupInfo>>;

  /**
   *
   */
  restoreBackup(backupId: string): Promise<StorageResult<void>>;

  /**
   *
   */
  listBackups(): Promise<StorageResult<BackupInfo[]>>;

  /**
   *
   */
  deleteBackup(backupId: string): Promise<StorageResult<void>>;

  /**
   *
   */
  verifyBackup(backupId: string): Promise<StorageResult<boolean>>;
}

/**
 *
 */
export type StorageOperation =
  | { type: 'set'; key: string; value: unknown }
  | { type: 'get'; key: string }
  | { type: 'delete'; key: string }
  | { type: 'clear' };

/**
 *
 */
export interface IndexOptions {
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
}

/**
 *
 */
export interface QueryFilter {
  [field: string]:
    | unknown
    | {
        $eq?: unknown;
        $ne?: unknown;
        $gt?: unknown;
        $gte?: unknown;
        $lt?: unknown;
        $lte?: unknown;
        $in?: unknown[];
        $nin?: unknown[];
      }
    | { $regex?: string; $options?: string }
    | { $exists?: boolean }
    | { $and?: QueryFilter[] }
    | { $or?: QueryFilter[] };
}

/**
 *
 */
export interface StorageStats {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  keyCount: number;
  collections?: CollectionStats[];
  lastCompacted?: Date;
  indexCount?: number;
}

/**
 *
 */
export interface CollectionStats {
  name: string;
  documentCount: number;
  size: number;
  indexes: string[];
}

/**
 *
 */
export interface CacheStats {
  hitCount: number;
  missCount: number;
  hitRatio: number;
  evictionCount: number;
  size: number;
  maxSize: number;
}

/**
 *
 */
export interface BackupInfo {
  id: string;
  createdAt: Date;
  size: number;
  checksum: string;
  metadata: Record<string, unknown>;
  compressed: boolean;
  version: string;
}

/**
 *
 */
export interface GameStoragePort
  extends QueryableStoragePort,
    CacheStoragePort,
    BackupStoragePort {
  /**
   *
   */
  saveGame(saveId: string, gameState: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  loadGame<T>(saveId: string): Promise<StorageResult<T>>;

  /**
   *
   */
  getSaveList(): Promise<StorageResult<SaveInfo[]>>;

  /**
   *
   */
  deleteSave(saveId: string): Promise<StorageResult<void>>;

  /**
   *
   */
  saveSettings(settings: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  loadSettings<T>(): Promise<StorageResult<T>>;

  /**
   *
   */
  saveConfig(config: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  loadConfig<T>(): Promise<StorageResult<T>>;

  /**
   *
   */
  saveAchievements(achievements: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  loadAchievements<T>(): Promise<StorageResult<T>>;

  /**
   *
   */
  saveStatistics(stats: unknown): Promise<StorageResult<void>>;

  /**
   *
   */
  loadStatistics<T>(): Promise<StorageResult<T>>;
}

/**
 *
 */
export interface SaveInfo {
  id: string;
  name: string;
  level: number;
  score: number;
  playTime: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  metadata: Record<string, unknown>;
}
