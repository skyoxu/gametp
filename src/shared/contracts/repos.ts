/**
 * Repository Pattern Contracts - Base-Clean Implementation
 *
 * ,.
 * ().
 *
 * ADR :
 * - ADR-0001: TypeScript
 * - ADR-0004:
 * - ADR-0005:
 */

// ====================  ====================

export interface Entity<TId = string> {
  readonly id: TId;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AggregateRoot<TId = string> extends Entity<TId> {
  readonly aggregateVersion: number;
  readonly domainEvents: DomainEvent[];

  clearEvents(): void;
  addEvent(event: DomainEvent): void;
}

// ==================== Repository  ====================

/**
 *  Repository
 *  CRUD
 */
export interface Repository<T> {
  /**
   *  ID
   * @param id
   * @returns  null()
   */
  getById(id: string): Promise<T | null>;

  /**
   * ()
   * @param entity
   */
  upsert(entity: T): Promise<void>;

  /**
   * ()
   * @param params
   */
  list(params?: RepositoryQueryParams): Promise<T[]>;

  /**
   *
   * @param id  ID
   */
  remove(id: string): Promise<void>;

  /**
   *
   * @param params
   */
  count(
    params?: Omit<RepositoryQueryParams, 'limit' | 'offset'>
  ): Promise<number>;
}

/**
 * Repository
 */
export interface RepositoryQueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// ====================  ====================

/**
 *
 *
 */
export interface IUnitOfWork {
  /**
   *
   */
  begin(): Promise<void>;

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
  registerClean<T extends AggregateRoot>(entity: T): void;

  /**
   *
   */
  registerDirty<T extends AggregateRoot>(entity: T): void;

  /**
   *
   */
  registerNew<T extends AggregateRoot>(entity: T): void;

  /**
   *
   */
  registerRemoved<T extends AggregateRoot>(entity: T): void;

  /**
   *
   */
  hasChanges(): boolean;
}

// ====================  ====================

/**
 *
 *
 */
export const PORT_IDS = {
  //
  STORAGE: 'storage.${DOMAIN_PREFIX}',
  CACHE: 'cache.${DOMAIN_PREFIX}',

  //
  EVENTS: 'events.${DOMAIN_PREFIX}',

  //
  QUERY: 'query.${DOMAIN_PREFIX}',

  //
  NOTIFICATION: 'notification.${DOMAIN_PREFIX}',

  //
  AUDIT: 'audit.${DOMAIN_PREFIX}',

  //
  MIGRATION: 'migration.${DOMAIN_PREFIX}',
} as const;

export type PortId = (typeof PORT_IDS)[keyof typeof PORT_IDS];

// ====================  ====================

/**
 *
 *  CloudEvents 1.0
 */
export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  readonly timestamp: Date;
  readonly data: unknown;
  readonly metadata?: DomainEventMetadata;
}

export interface DomainEventMetadata {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly userId?: string;
  readonly source?: string;
  readonly traceId?: string;
}

// ====================  ====================

/**
 *
 */
export interface StorageAdapterFactory {
  createRepository<T extends Entity>(
    entityType: string,
    options?: StorageOptions
  ): Repository<T>;

  createUnitOfWork(): IUnitOfWork;

  /**
   *
   */
  healthCheck(): Promise<StorageHealthStatus>;
}

export interface StorageOptions {
  readonly connectionString?: string;
  readonly timeout?: number;
  readonly retryPolicy?: RetryPolicy;
  readonly consistencyLevel?: ConsistencyLevel;
}

export interface StorageHealthStatus {
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly details?: Record<string, unknown>;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly delayMs: number;
  readonly backoffMultiplier?: number;
}

export enum ConsistencyLevel {
  STRONG = 'strong',
  EVENTUAL = 'eventual',
  SESSION = 'session',
}

// ====================  ====================

/**
 *
 */
export interface Migration {
  readonly version: string;
  readonly description: string;
  readonly timestamp: Date;

  /**
   *
   */
  up(): Promise<void>;

  /**
   *
   */
  down(): Promise<void>;

  /**
   *
   */
  validate(): Promise<boolean>;
}

export interface MigrationRunner {
  /**
   *
   */
  runMigrations(migrations: Migration[]): Promise<void>;

  /**
   *
   */
  rollbackTo(version: string): Promise<void>;

  /**
   *
   */
  getCurrentVersion(): Promise<string>;

  /**
   *
   */
  getMigrationHistory(): Promise<MigrationRecord[]>;
}

export interface MigrationRecord {
  readonly version: string;
  readonly description: string;
  readonly appliedAt: Date;
  readonly executionTimeMs: number;
  readonly checksum: string;
}

// ====================  ====================

/**
 *
 */
export interface EntitySerializer<T> {
  serialize(entity: T): Record<string, unknown>;
  deserialize(data: Record<string, unknown>): T;
  getSchemaVersion(): string;
}

// ====================  ====================

/**
 *
 */
export interface AuditLogger {
  logEntry(entry: AuditEntry): Promise<void>;
  queryEntries(query: AuditQuery): Promise<AuditEntry[]>;
}

export interface AuditEntry {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly operation: 'CREATE' | 'UPDATE' | 'DELETE';
  readonly userId?: string;
  readonly timestamp: Date;
  readonly oldValues?: Record<string, unknown>;
  readonly newValues?: Record<string, unknown>;
  readonly metadata: AuditMetadata;
}

export interface AuditMetadata {
  readonly source: string;
  readonly traceId?: string;
  readonly sessionId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  userId?: string;
  operation?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ====================  ====================

/**
 *
 */
export function isEntity(value: unknown): value is Entity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'version' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  );
}

export function isAggregateRoot(value: unknown): value is AggregateRoot {
  return (
    isEntity(value) &&
    'aggregateVersion' in value &&
    'domainEvents' in value &&
    'clearEvents' in value &&
    'addEvent' in value
  );
}

// ====================  ====================

/**
 * Repository
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly entityType?: string,
    public readonly entityId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class EntityNotFoundError extends RepositoryError {
  constructor(entityType: string, entityId: string) {
    super(`Entity not found: ${entityType}#${entityId}`, entityType, entityId);
    this.name = 'EntityNotFoundError';
  }
}

export class ConcurrencyError extends RepositoryError {
  constructor(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `Concurrency conflict: ${entityType}#${entityId}, expected version ${expectedVersion}, actual version ${actualVersion}`,
      entityType,
      entityId
    );
    this.name = 'ConcurrencyError';
  }
}

export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly version: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}
