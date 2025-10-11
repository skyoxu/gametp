/**
 * Ports-and-adapters foundational type definitions - ADR-0007
 *
 * Provides clean-architecture port interfaces and common types
 * Supports Repository pattern and port abstractions
 */

/**
 * Generic ID type
 */
export type Id = string | number;

/**
 * Base entity interface
 */
export interface Entity<TId = Id> {
  readonly id: TId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Generic port interface
 */
export interface Port {
  readonly name: string;
  readonly version: string;
}

/**
 * Repository base interface
 */
export interface IRepository<TEntity extends Entity, TId = Id> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  save(
    entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TEntity>;
  update(id: TId, updates: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<boolean>;
  exists(id: TId): Promise<boolean>;
}

/**
 * Query interface
 */
export interface Query<TResult = unknown> {
  readonly type: string;
  readonly params: Record<string, unknown>;
}

/**
 * Command interface
 */
export interface Command<TResult = unknown> {
  readonly type: string;
  readonly payload: Record<string, unknown>;
}

/**
 * Port adapter interface
 */
export interface PortAdapter<TInput = unknown, TOutput = unknown> {
  readonly port: Port;
  transform(input: TInput): Promise<TOutput>;
}

/**
 * Domain service interface
 */
export interface DomainService {
  readonly name: string;
}

/**
 * Application service interface
 */
export interface ApplicationService {
  readonly name: string;
}
